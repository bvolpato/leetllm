import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import type { PracticeProblem, PracticeProblemLanguageBundle, PracticeTestCase } from "./practice"
import { getPracticeLanguagePrelude } from "./practice-languages"
import type { PracticeLanguage } from "./practice-languages"

function resolveLanguageBundle(
    problem: PracticeProblem,
    language: PracticeLanguage,
): PracticeProblemLanguageBundle | undefined {
    const bundle = problem.languages?.[language]
    if (bundle) return bundle
    if (language === problem.language) {
        return {
            starterCode: problem.starterCode,
            testCases: problem.testCases,
            solutionGuide: problem.solutionGuide,
        }
    }
    return undefined
}
import {
    javaSandboxEnvironment,
    validateCompiledJavaClasses,
    validateJavaSource,
} from "./practice-java-sandbox"
import { spawnSandboxedProcess } from "./practice-sandbox-exec"

export type PracticeRunMode = "run" | "submit"

export interface PracticeExecutionSpec {
    slug: string
    language: PracticeLanguage
    timeLimitMs: number
    memoryLimitMb: number
    testCases: PracticeTestCase[]
}

export interface PracticeCaseResult {
    name: string
    visibility: PracticeTestCase["visibility"]
    passed: boolean
    durationMs: number
    stdout: string
    stderr: string
    error?: string
    errorLineNumber?: number | null
    errorLine?: string | null
    description?: string
    input?: string
    expected?: string
    feedback?: string
    assertion?: {
        actual: string
        expected: string
        operator: string
        input?: string
    } | null
}

export interface PracticeRunResult {
    ok: boolean
    mode: PracticeRunMode
    passed: number
    total: number
    runtimeMs: number
    memoryKb: number
    results: PracticeCaseResult[]
    error?: string
}

interface ProcessResult {
    stdout: string
    stderr: string
    exitCode: number | null
    timedOut: boolean
    outputLimitExceeded: boolean
    error?: string
}

const runnerSource = String.raw`
import ast
import builtins
import contextlib
import io
import json
import linecache
import resource
import sys
import time
import traceback
import types

SAFE_IMPORT_ROOTS = {
    "bisect",
    "collections",
    "concurrent",
    "dataclasses",
    "decimal",
    "enum",
    "functools",
    "heapq",
    "itertools",
    "math",
    "operator",
    "queue",
    "re",
    "statistics",
    "string",
    "threading",
    "time",
    "typing",
}
SAFE_EXACT_IMPORTS = {
    "concurrent.futures",
    "collections.abc",
    "urllib.parse",
}
DENIED_IMPORTS = {
    "builtins",
    "ctypes",
    "fcntl",
    "ftplib",
    "gc",
    "glob",
    "http",
    "importlib",
    "inspect",
    "io",
    "marshal",
    "multiprocessing",
    "os",
    "pathlib",
    "pickle",
    "pkgutil",
    "pydoc",
    "requests",
    "resource",
    "secrets",
    "selectors",
    "shutil",
    "signal",
    "socket",
    "ssl",
    "subprocess",
    "sys",
    "urllib.request",
    "webbrowser",
}
DENIED_BUILTINS = {
    "__import__",
    "breakpoint",
    "compile",
    "delattr",
    "dir",
    "eval",
    "exec",
    "getattr",
    "globals",
    "help",
    "input",
    "locals",
    "memoryview",
    "open",
    "setattr",
    "vars",
}
DENIED_ATTRIBUTES = {
    "__bases__",
    "__builtins__",
    "__class__",
    "__closure__",
    "__code__",
    "__dict__",
    "__func__",
    "__getattribute__",
    "__globals__",
    "__mro__",
    "__reduce__",
    "__reduce_ex__",
    "__self__",
    "__subclasses__",
    "_builtins",
    "_io",
    "_os",
    "_sys",
    "ag_code",
    "ag_frame",
    "attrgetter",
    "co_code",
    "co_consts",
    "cr_code",
    "cr_frame",
    "f_back",
    "f_builtins",
    "f_code",
    "f_globals",
    "f_locals",
    "format",
    "format_map",
    "Formatter",
    "func_code",
    "func_globals",
    "get_field",
    "get_value",
    "gi_code",
    "gi_frame",
    "im_func",
    "im_self",
    "methodcaller",
    "modules",
    "tb_frame",
    "tb_next",
    "vformat",
}

_AUDIT_BLOCKED_EVENTS = {
    "open",
    "code.__new__",
    "function.__new__",
    "sys._getframe",
    "sys.settrace",
    "sys.setprofile",
    "sys.addaudithook",
    "sys.set_asyncgen_hooks",
}
_AUDIT_BLOCKED_PREFIXES = (
    "os.",
    "subprocess.",
    "socket.",
    "ctypes.",
    "http.client.",
    "urllib.",
    "ftplib.",
    "poplib.",
    "imaplib.",
    "smtplib.",
    "telnetlib.",
    "webbrowser.",
    "shutil.",
    "posix.",
    "nt.",
    "signal.",
    "fcntl.",
    "pty.",
    "resource.",
    "gc.",
    "marshal.",
    "pickle.",
    "winreg.",
    "msvcrt.",
)


def _create_sandbox_guard():
    import collections
    import dataclasses

    state = {"active": False, "runner_compiling": False, "in_hook": False}
    allowed_code_ids = set()
    trusted_stdlib_files = {
        getattr(dataclasses, "__file__", ""),
        getattr(collections, "__file__", ""),
    }
    trusted_stdlib_files.discard("")

    def _caller_is_trusted_stdlib():
        state["in_hook"] = True
        try:
            frame = sys._getframe(2)
            while frame is not None:
                filename = frame.f_code.co_filename
                if filename in trusted_stdlib_files:
                    return True
                if filename == "solution.py" or filename.startswith("testcase_"):
                    return False
                frame = frame.f_back
            return False
        finally:
            state["in_hook"] = False

    def audit_hook(event, args):
        if not state["active"] or state["in_hook"]:
            return
        if event in _AUDIT_BLOCKED_EVENTS or event.startswith(_AUDIT_BLOCKED_PREFIXES):
            raise PermissionError(f"Sandbox blocked operation: {event}")
        if event == "compile":
            if state["runner_compiling"] or _caller_is_trusted_stdlib():
                return
            raise PermissionError(f"Sandbox blocked operation: {event}")
        if event == "exec":
            code_obj = args[0] if args else None
            if code_obj is not None and id(code_obj) in allowed_code_ids:
                allowed_code_ids.discard(id(code_obj))
                return
            if _caller_is_trusted_stdlib():
                return
            raise PermissionError(f"Sandbox blocked operation: {event}")
        if event == "import":
            module_name = args[0] if args else ""
            if isinstance(module_name, str) and module_name:
                if module_name in sys.modules:
                    root = root_import(module_name)
                    if root in DENIED_IMPORTS or module_name in DENIED_IMPORTS:
                        raise PermissionError(f"Sandbox blocked import: {module_name}")
                    return
                if not import_allowed(module_name):
                    raise PermissionError(f"Sandbox blocked import: {module_name}")

    def set_active(flag):
        state["active"] = bool(flag)

    def run_trusted_compile(fn, *args, **kwargs):
        state["runner_compiling"] = True
        try:
            return fn(*args, **kwargs)
        finally:
            state["runner_compiling"] = False

    def compile_trusted(source_or_ast, filename, mode):
        code_obj = run_trusted_compile(compile, source_or_ast, filename, mode)
        allowed_code_ids.add(id(code_obj))
        return code_obj

    sys.addaudithook(audit_hook)
    return set_active, compile_trusted, run_trusted_compile


def _preimport_safe_stdlib():
    for module_name in sorted(SAFE_IMPORT_ROOTS | SAFE_EXACT_IMPORTS | {"concurrent.futures.thread", "re"}):
        try:
            __import__(module_name)
        except Exception:
            pass
    try:
        from concurrent.futures import Future, ThreadPoolExecutor, as_completed  # noqa: F401
    except Exception:
        pass


def _safe_type(*args):
    if len(args) != 1:
        raise TypeError("Dynamic type() creation is not allowed in the practice sandbox")
    return type(args[0])


def attribute_denied(name):
    return (
        name in DENIED_ATTRIBUTES
        or name in DENIED_IMPORTS
        or name.startswith("__")
        or name.endswith("__")
    )


def root_import(name):
    return name.split(".", 1)[0]


def import_allowed(name, fromlist=()):
    if name == "solution":
        return True
    if name in SAFE_EXACT_IMPORTS:
        return True
    if name == "urllib":
        return all(item == "parse" for item in fromlist)
    if name.startswith("urllib."):
        return name == "urllib.parse"
    return root_import(name) in SAFE_IMPORT_ROOTS


def ensure_import_allowed(name, fromlist=()):
    for item in fromlist:
        if attribute_denied(item):
            raise RuntimeError(f"Import not allowed: {name}.{item}")
    if name == "urllib":
        for item in fromlist:
            imported = f"urllib.{item}"
            if imported in DENIED_IMPORTS or not import_allowed(imported):
                raise RuntimeError(f"Import not allowed: {imported}")
    if name in DENIED_IMPORTS or root_import(name) in DENIED_IMPORTS or not import_allowed(name, fromlist):
        raise RuntimeError(f"Import not allowed: {name}")


def validate_source(source):
    tree = ast.parse(source, filename="solution.py")
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                ensure_import_allowed(alias.name)
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            ensure_import_allowed(module, tuple(alias.name for alias in node.names))
        elif isinstance(node, ast.Name) and node.id in DENIED_BUILTINS:
            raise RuntimeError(f"Name not allowed: {node.id}")
        elif isinstance(node, ast.Attribute):
            if attribute_denied(node.attr):
                raise RuntimeError(f"Attribute not allowed: {node.attr}")


def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level != 0:
        raise ImportError("Relative imports are not allowed")
    ensure_import_allowed(name, tuple(fromlist or ()))
    if name == "solution":
        return sys.modules["solution"]
    return builtins.__import__(name, globals, locals, fromlist, level)


def safe_builtins():
    allowed = dict(vars(builtins))
    for name in DENIED_BUILTINS:
        allowed.pop(name, None)
    allowed["type"] = _safe_type
    allowed["__import__"] = safe_import
    return allowed


def load_solution(prelude, source, compile_trusted):
    module = types.ModuleType("solution")
    module.__file__ = "solution.py"
    module.__dict__["__builtins__"] = safe_builtins()
    sys.modules["solution"] = module
    try:
        if prelude:
            prelude_code = compile_trusted(prelude, "leetllm_prelude.py", "exec")
            exec(prelude_code, module.__dict__)
        solution_code = compile_trusted(source, "solution.py", "exec")
        exec(solution_code, module.__dict__)
    except BaseException:
        sys.modules.pop("solution", None)
        raise
    return module


class PracticeAssertionError(AssertionError):
    def __init__(self, actual, expected, operator, line_number, source_line, message=None, input_label=None, feedback=None):
        self.actual = format_assertion_value(actual)
        self.expected = format_assertion_value(expected)
        self.operator = operator
        self.line_number = line_number
        self.source_line = source_line
        self.input = input_label
        self.feedback = feedback
        if message is None:
            message = f"expected {self.expected} but got {self.actual}"
        super().__init__(message)


def format_assertion_value(value):
    try:
        rendered = repr(value)
    except BaseException:
        rendered = f"<unrepresentable {type(value).__name__}>"
    if len(rendered) > 2000:
        return rendered[:2000] + "... <truncated>"
    return rendered


def compare_values(actual, expected, operator):
    if operator == "==":
        return actual == expected
    if operator == "!=":
        return actual != expected
    if operator == "<":
        return actual < expected
    if operator == "<=":
        return actual <= expected
    if operator == ">":
        return actual > expected
    if operator == ">=":
        return actual >= expected
    if operator == "is":
        return actual is expected
    if operator == "is not":
        return actual is not expected
    if operator == "in":
        return actual in expected
    if operator == "not in":
        return actual not in expected
    raise AssertionError(f"Unsupported assertion operator: {operator}")


def assert_compare(actual, expected, operator, line_number, source_line, message=None):
    if not compare_values(actual, expected, operator):
        raise PracticeAssertionError(actual, expected, operator, line_number, source_line, message)


def assert_operator_symbol(operator):
    if isinstance(operator, ast.Eq):
        return "=="
    if isinstance(operator, ast.NotEq):
        return "!="
    if isinstance(operator, ast.Lt):
        return "<"
    if isinstance(operator, ast.LtE):
        return "<="
    if isinstance(operator, ast.Gt):
        return ">"
    if isinstance(operator, ast.GtE):
        return ">="
    if isinstance(operator, ast.Is):
        return "is"
    if isinstance(operator, ast.IsNot):
        return "is not"
    if isinstance(operator, ast.In):
        return "in"
    if isinstance(operator, ast.NotIn):
        return "not in"
    return None


def rewrite_test_assertions(source, filename):
    lines = source.splitlines()

    class AssertRewriter(ast.NodeTransformer):
        def visit_Assert(self, node):
            self.generic_visit(node)
            if not isinstance(node.test, ast.Compare):
                return node
            if len(node.test.ops) != 1 or len(node.test.comparators) != 1:
                return node

            operator = assert_operator_symbol(node.test.ops[0])
            if operator is None:
                return node

            source_line = ""
            if 1 <= node.lineno <= len(lines):
                source_line = lines[node.lineno - 1].strip()

            call = ast.Call(
                func=ast.Name(id="__practice_assert_compare", ctx=ast.Load()),
                args=[
                    node.test.left,
                    node.test.comparators[0],
                    ast.Constant(operator),
                    ast.Constant(node.lineno),
                    ast.Constant(source_line),
                    node.msg or ast.Constant(None),
                ],
                keywords=[],
            )
            return ast.copy_location(ast.Expr(value=call), node)

    tree = ast.parse(source, filename=filename)
    tree = AssertRewriter().visit(tree)
    ast.fix_missing_locations(tree)
    return tree


def apply_limits(memory_mb, cpu_seconds):
    memory_bytes = max(memory_mb, 96) * 1024 * 1024
    # macOS rejects finite RLIMIT_AS values below Python's existing virtual
    # address space. Production runs on Linux, where this limit is enforced.
    if sys.platform != "darwin":
        resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
    resource.setrlimit(resource.RLIMIT_CPU, (max(1, cpu_seconds), max(1, cpu_seconds)))
    try:
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    except (OSError, ValueError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))
    except (OSError, ValueError):
        pass
    try:
        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        target = min(64, hard) if hard != resource.RLIM_INFINITY else 64
        if soft > target:
            resource.setrlimit(resource.RLIMIT_NOFILE, (target, target))
    except (OSError, ValueError):
        pass


def current_memory_kb():
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    if sys.platform == "darwin":
        return usage // 1024
    return usage


def fail_all(tests, message, started_at):
    now = time.perf_counter()
    return {
        "ok": False,
        "runtimeMs": round((now - started_at) * 1000, 2),
        "memoryKb": current_memory_kb(),
        "results": [
            {
                "name": test["name"],
                "visibility": test["visibility"],
                "passed": False,
                "durationMs": 0,
                "stdout": "",
                "stderr": "",
                "error": message,
                "description": test.get("description"),
                "input": test.get("input"),
                "expected": test.get("expected"),
                "feedback": test.get("feedback"),
            }
            for test in tests
        ],
    }


def safe_filename_part(value):
    cleaned = "".join(ch if ch.isalnum() else "_" for ch in value).strip("_")
    return cleaned[:48] or "case"


def test_filename(index, test):
    return f"testcase_{index + 1}_{safe_filename_part(test['name'])}.py"


def register_source(filename, source):
    lines = source.splitlines(keepends=True)
    linecache.cache[filename] = (len(source), None, lines, filename)


def traceback_source_line(exc, filename, source):
    line_number = None
    tb = exc.__traceback__
    while tb:
        if tb.tb_frame.f_code.co_filename == filename:
            line_number = tb.tb_lineno
        tb = tb.tb_next

    if line_number is None:
        return None, None

    lines = source.splitlines()
    if 1 <= line_number <= len(lines):
        return line_number, lines[line_number - 1].strip()
    return line_number, None


def eval_check_expression(source, filename, namespace, compile_trusted):
    compiled = compile_trusted(source, filename, "eval")
    return eval(compiled, namespace)


def exec_check_source(source, filename, namespace, compile_trusted):
    if source:
        register_source(filename, source)
        compiled = compile_trusted(source, filename, "exec")
        exec(compiled, namespace)


def run_structured_test(test, index, namespace, compile_trusted):
    setup_code = test.get("setup") or ""
    setup_filename = test_filename(index, test).replace(".py", "_setup.py")
    exec_check_source(setup_code, setup_filename, namespace, compile_trusted)
    test_input = test.get("input")
    test_expected = test.get("expected")

    failed_check = None
    assertion = None
    error_line = None
    error_line_number = None
    for check_index, check in enumerate(test.get("checks") or []):
        failed_check = check
        before_code = check.get("before") or ""
        before_filename = test_filename(index, test).replace(".py", f"_before_{check_index + 1}.py")
        exec_check_source(before_code, before_filename, namespace, compile_trusted)

        actual = eval_check_expression(
            check["expression"],
            test_filename(index, test).replace(".py", f"_actual_{check_index + 1}.py"),
            namespace,
            compile_trusted,
        )
        expected = eval_check_expression(
            check["expected"],
            test_filename(index, test).replace(".py", f"_expected_{check_index + 1}.py"),
            namespace,
            compile_trusted,
        )
        operator = check.get("operator") or "=="
        error_line = check["expression"]
        if not compare_values(actual, expected, operator):
            display_input = test_input or check.get("input") or check["expression"]
            display_expected = test_expected or check.get("expected")
            assertion = {
                "actual": format_assertion_value(actual),
                "expected": format_assertion_value(expected),
                "operator": operator,
                "input": display_input,
            }
            failed_check = {"feedback": check.get("feedback"), "input": display_input, "expected": display_expected}
            error_line_number = check_index + 1
            raise PracticeAssertionError(
                actual,
                expected,
                operator,
                error_line_number,
                error_line,
                input_label=display_input,
                feedback=check.get("feedback"),
            )

    return failed_check, assertion, error_line_number, error_line


def main():
    started_at = time.perf_counter()
    config = json.loads(sys.stdin.read())
    tests = config["tests"]

    try:
        apply_limits(config["memoryLimitMb"], config["cpuSeconds"])
        with open("solution.py", "r", encoding="utf-8") as handle:
            source = handle.read()
        register_source("solution.py", source)
        validate_source(source)
        _preimport_safe_stdlib()
        set_sandbox_active, compile_trusted, run_trusted_compile = _create_sandbox_guard()
        set_sandbox_active(True)

        import_stdout = io.StringIO()
        import_stderr = io.StringIO()
        with contextlib.redirect_stdout(import_stdout), contextlib.redirect_stderr(import_stderr):
            load_solution(config.get("prelude", ""), source, compile_trusted)
    except BaseException:
        if "set_sandbox_active" in locals():
            set_sandbox_active(False)
        print(json.dumps(fail_all(tests, traceback.format_exc(limit=6), started_at)))
        return

    results = []
    for index, test in enumerate(tests):
        stdout = io.StringIO()
        stderr = io.StringIO()
        case_started = time.perf_counter()
        namespace = {"__name__": "__practice_test__", "__builtins__": safe_builtins()}
        passed = True
        error = None
        error_line_number = None
        error_line = None
        assertion = None
        filename = test_filename(index, test)
        test_code = test.get("code") or ""
        if test_code:
            register_source(filename, test_code)
        failed_check = None

        try:
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                if test.get("checks"):
                    failed_check, assertion, error_line_number, error_line = run_structured_test(
                        test, index, namespace, compile_trusted
                    )
                else:
                    if test.get("visibility") == "custom":
                        run_trusted_compile(validate_source, test_code)
                    namespace["__practice_assert_compare"] = assert_compare
                    rewritten = run_trusted_compile(rewrite_test_assertions, test_code, filename)
                    compiled_test = compile_trusted(rewritten, filename, "exec")
                    exec(compiled_test, namespace)
        except BaseException as exc:
            passed = False
            set_sandbox_active(False)
            try:
                error = traceback.format_exc(limit=6)
            finally:
                set_sandbox_active(True)
            if isinstance(exc, PracticeAssertionError):
                error_line_number = error_line_number or exc.line_number
                error_line = error_line or exc.source_line
                if assertion is None:
                    assertion = {
                        "actual": exc.actual,
                        "expected": exc.expected,
                        "operator": exc.operator,
                    }
                    if getattr(exc, "input", None):
                        assertion["input"] = exc.input
                        failed_check = {"feedback": getattr(exc, "feedback", None), "input": exc.input, "expected": exc.expected}
            else:
                error_line_number, error_line = traceback_source_line(exc, filename, test_code)

        results.append(
            {
                "name": test["name"],
                "visibility": test["visibility"],
                "passed": passed,
                "durationMs": round((time.perf_counter() - case_started) * 1000, 2),
                "stdout": stdout.getvalue()[-4000:],
                "stderr": stderr.getvalue()[-4000:],
                "error": error,
                "errorLineNumber": error_line_number,
                "errorLine": error_line,
                "description": test.get("description"),
                "input": test.get("input") or (assertion or {}).get("input") or ((failed_check or {}).get("input") if not passed else None),
                "expected": test.get("expected") or (((failed_check or {}).get("expected") if not passed else None)),
                "feedback": ((failed_check or {}).get("feedback") if not passed else None) or test.get("feedback"),
                "assertion": assertion,
            }
        )

    runtime_ms = round((time.perf_counter() - started_at) * 1000, 2)
    print(
        json.dumps(
            {
                "ok": all(result["passed"] for result in results),
                "runtimeMs": runtime_ms,
                "memoryKb": current_memory_kb(),
                "results": results,
            }
        )
    )


if __name__ == "__main__":
    main()
`

const JAVA_COMPILE_TIMEOUT_MS = 10000
const PROCESS_OUTPUT_LIMIT_BYTES = 64 * 1024

function runProcess({
    command,
    args,
    cwd,
    env,
    stdin,
    timeoutMs,
}: {
    command: string
    args: string[]
    cwd: string
    env: NodeJS.ProcessEnv
    stdin?: string
    timeoutMs: number
}): Promise<ProcessResult> {
    return new Promise((resolve) => {
        const { child } = spawnSandboxedProcess({
            command,
            args,
            workDir: cwd,
            env,
        })

        let stdout = ""
        let stderr = ""
        let stdoutBytes = 0
        let stderrBytes = 0
        let timedOut = false
        let outputLimitExceeded = false
        const timer = setTimeout(() => {
            timedOut = true
            child.kill("SIGKILL")
        }, timeoutMs)

        child.stdout.on("data", (chunk) => {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            const remaining = Math.max(0, PROCESS_OUTPUT_LIMIT_BYTES - stdoutBytes)
            stdout += bytes.subarray(0, remaining).toString()
            stdoutBytes += bytes.length
            if (stdoutBytes > PROCESS_OUTPUT_LIMIT_BYTES && !outputLimitExceeded) {
                outputLimitExceeded = true
                child.kill("SIGKILL")
            }
        })
        child.stderr.on("data", (chunk) => {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            const remaining = Math.max(0, PROCESS_OUTPUT_LIMIT_BYTES - stderrBytes)
            stderr += bytes.subarray(0, remaining).toString()
            stderrBytes += bytes.length
            if (stderrBytes > PROCESS_OUTPUT_LIMIT_BYTES && !outputLimitExceeded) {
                outputLimitExceeded = true
                child.kill("SIGKILL")
            }
        })
        child.on("error", (error) => {
            clearTimeout(timer)
            resolve({ stdout, stderr, exitCode: null, timedOut, outputLimitExceeded, error: error.message })
        })
        child.on("close", (exitCode) => {
            clearTimeout(timer)
            resolve({ stdout, stderr, exitCode, timedOut, outputLimitExceeded })
        })

        child.stdin.end(stdin)
    })
}

function parseRunnerOutput(
    output: string,
    mode: PracticeRunMode,
    total: number,
    fallbackError?: string
): PracticeRunResult {
    if (!output.trim()) {
        return {
            ok: false,
            mode,
            passed: 0,
            total,
            runtimeMs: 0,
            memoryKb: 0,
            results: [],
            error: fallbackError || "Runner produced no output",
        }
    }

    try {
        const parsed = JSON.parse(output) as {
            ok: boolean
            runtimeMs: number
            memoryKb: number
            results: PracticeCaseResult[]
        }
        const passed = parsed.results.filter((result) => result.passed).length
        return {
            ok: parsed.ok,
            mode,
            passed,
            total,
            runtimeMs: parsed.runtimeMs,
            memoryKb: parsed.memoryKb,
            results: parsed.results,
        }
    } catch {
        return {
            ok: false,
            mode,
            passed: 0,
            total,
            runtimeMs: 0,
            memoryKb: 0,
            results: [],
            error: fallbackError || output.slice(-4000),
        }
    }
}

async function runPythonCode({
    problem,
    code,
    mode,
    language,
    customTests,
}: {
    problem: PracticeProblem
    code: string
    mode: PracticeRunMode
    language: PracticeLanguage
    customTests?: PracticeTestCase[]
}): Promise<PracticeRunResult> {
    const languageBundle = resolveLanguageBundle(problem, language)
    if (!languageBundle) {
        return {
            ok: false,
            mode,
            passed: 0,
            total: 0,
            runtimeMs: 0,
            memoryKb: 0,
            results: [],
            error: `Unsupported language: ${language}`,
        }
    }

    const tests = customTests?.length
        ? customTests
        : languageBundle.testCases.filter((testCase) => mode === "submit" || testCase.visibility === "sample")
    const workDir = mkdtempSync(join(tmpdir(), "leetllm-practice-"))
    const timeoutMs = Math.max(problem.timeLimitMs, 1000)

    writeFileSync(join(workDir, "solution.py"), code, "utf-8")
    writeFileSync(join(workDir, "runner.py"), runnerSource, "utf-8")

    try {
        const runnerEnv: NodeJS.ProcessEnv = {
            NODE_ENV: process.env.NODE_ENV || "production",
            PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
            PYTHONPATH: workDir,
            PYTHONDONTWRITEBYTECODE: "1",
        }
        const run = await runProcess({
            command: "python3",
            args: ["runner.py"],
            cwd: workDir,
            env: runnerEnv,
            stdin: JSON.stringify({
                tests,
                prelude: getPracticeLanguagePrelude(language),
                memoryLimitMb: problem.memoryLimitMb,
                cpuSeconds: Math.ceil(timeoutMs / 1000) + 1,
            }),
            timeoutMs,
        })
        if (run.error) {
            return {
                ok: false,
                mode,
                passed: 0,
                total: tests.length,
                runtimeMs: timeoutMs,
                memoryKb: 0,
                results: [],
                error: run.error,
            }
        }
        if (run.timedOut) {
            return {
                ok: false,
                mode,
                passed: 0,
                total: tests.length,
                runtimeMs: timeoutMs,
                memoryKb: 0,
                results: tests.map((testCase) => ({
                    name: testCase.name,
                    visibility: testCase.visibility,
                    passed: false,
                    durationMs: 0,
                    stdout: "",
                    stderr: "",
                    error: `Timed out after ${timeoutMs}ms`,
                    description: testCase.description,
                    input: testCase.input,
                    expected: testCase.expected,
                    feedback: testCase.feedback,
                })),
            }
        }
        if (run.outputLimitExceeded) {
            return {
                ok: false,
                mode,
                passed: 0,
                total: tests.length,
                runtimeMs: 0,
                memoryKb: 0,
                results: tests.map((testCase) => ({
                    name: testCase.name,
                    visibility: testCase.visibility,
                    passed: false,
                    durationMs: 0,
                    stdout: "",
                    stderr: "",
                    error: "Output exceeded limit",
                    description: testCase.description,
                    input: testCase.input,
                    expected: testCase.expected,
                    feedback: testCase.feedback,
                })),
            }
        }
        return parseRunnerOutput(run.stdout, mode, tests.length, run.stderr)
    } finally {
        rmSync(workDir, { recursive: true, force: true })
    }
}

function indentJavaBody(source: string): string {
    return source.split(/\r?\n/).map((line) => (line ? `        ${line}` : "")).join("\n")
}

function javaTestClassName(index: number) {
    return `TestCase${index + 1}`
}

function decodeJavaAssertionValue(value: string): string {
    try {
        return Buffer.from(value, "base64").toString("utf-8")
    } catch {
        return value
    }
}

function parseJavaAssertion(output: string): PracticeCaseResult["assertion"] {
    const match = output.match(/__LEETLLM_ASSERT__\|([^|]+)\|([^|\s]+)\|([^|\s]+)(?:\|([^|\s]+))?/)
    if (!match) return null

    return {
        operator: match[1],
        expected: decodeJavaAssertionValue(match[2]),
        actual: decodeJavaAssertionValue(match[3]),
        input: match[4] ? decodeJavaAssertionValue(match[4]) : undefined,
    }
}

function buildJavaStructuredTestBody(testCase: PracticeTestCase): string {
    const lines: string[] = []
    if (testCase.setup) lines.push(testCase.setup)
    for (const check of testCase.checks ?? []) {
        const escapedInput = JSON.stringify(testCase.input || check.input)
        if (check.before) lines.push(check.before)
        lines.push(`checkCase(${escapedInput}, () -> {`)
        if (check.operator !== "==") {
            lines.push(`    throw new AssertionError("Unsupported structured Java operator: ${check.operator}");`)
        } else {
            lines.push(`    eq(${check.expression}, ${check.expected});`)
        }
        lines.push("});")
    }
    return lines.join("\n")
}

function javaTestBody(testCase: PracticeTestCase): string {
    if (testCase.checks?.length) return buildJavaStructuredTestBody(testCase)
    return testCase.code ?? ""
}

function buildJavaTestSource(index: number, testCase: PracticeTestCase, prelude: string): { source: string; bodyStartLine: number; body: string } {
    const className = javaTestClassName(index)
    const header = [
        prelude,
        "",
        `class ${className} {`,
        "    interface ThrowingRunnable { void run() throws Exception; }",
        "    static String currentInput = \"\";",
        "    static String encode(Object value) {",
        "        return Base64.getEncoder().encodeToString(String.valueOf(value).getBytes());",
        "    }",
        "    static AssertionError compareError(Object actual, Object expected, String operator) {",
        "        return new AssertionError(\"__LEETLLM_ASSERT__|\" + operator + \"|\" + encode(expected) + \"|\" + encode(actual) + \"|\" + encode(currentInput));",
        "    }",
        "    static void check(boolean condition, String message) {",
        "        if (!condition) throw compareError(false, true, \"==\");",
        "    }",
        "    static void check(boolean condition) {",
        "        check(condition, \"check failed\");",
        "    }",
        "    static void eq(Object actual, Object expected) {",
        "        if (!Objects.equals(actual, expected)) throw compareError(actual, expected, \"==\");",
        "    }",
        "    static void eq(int actual, int expected) {",
        "        if (actual != expected) throw compareError(actual, expected, \"==\");",
        "    }",
        "    static void eq(long actual, long expected) {",
        "        if (actual != expected) throw compareError(actual, expected, \"==\");",
        "    }",
        "    static void eq(boolean actual, boolean expected) {",
        "        if (actual != expected) throw compareError(actual, expected, \"==\");",
        "    }",
        "    static void eq(double actual, double expected) {",
        "        if (Double.isNaN(actual) || Double.isNaN(expected) || (actual != expected && (Double.isInfinite(actual) || Double.isInfinite(expected) || Math.abs(actual - expected) > 1e-9))) throw compareError(actual, expected, \"==\");",
        "    }",
        "    @SafeVarargs static <T> List<T> list(T... items) {",
        "        return new ArrayList<>(Arrays.asList(items));",
        "    }",
        "    static Set<String> set(String... items) {",
        "        return new LinkedHashSet<>(Arrays.asList(items));",
        "    }",
        "    static Map<String, Object> map(Object... items) {",
        "        Map<String, Object> result = new LinkedHashMap<>();",
        "        for (int i = 0; i < items.length; i += 2) result.put((String) items[i], items[i + 1]);",
        "        return result;",
        "    }",
        "    static void throwsException(Class<? extends Throwable> type, ThrowingRunnable runnable) throws Exception {",
        "        try {",
        "            runnable.run();",
        "        } catch (Throwable error) {",
        "            if (type.isInstance(error)) return;",
        "            throw new AssertionError(compareError(error.getClass().getSimpleName(), type.getSimpleName(), \"throws\").getMessage(), error);",
        "        }",
        "        throw compareError(\"no exception\", type.getSimpleName(), \"throws\");",
        "    }",
        "    static void checkCase(String input, ThrowingRunnable runnable) throws Exception {",
        "        currentInput = input;",
        "        try {",
        "            runnable.run();",
        "        } finally {",
        "            currentInput = \"\";",
        "        }",
        "    }",
        "    public static void main(String[] args) throws Exception {",
    ].join("\n")
    const bodyStartLine = header.split("\n").length + 1
    const body = javaTestBody(testCase)
    const source = [
        header,
        indentJavaBody(body),
        "    }",
        "}",
    ].join("\n")
    return { source, bodyStartLine, body }
}

function javaFailureLine(stderr: string, className: string, testCode: string, bodyStartLine: number): { lineNumber: number | null; line: string | null } {
    const lines = testCode.split(/\r?\n/)
    const matches = stderr.matchAll(new RegExp(`${className}\\.java:(\\d+)`, "g"))
    for (const match of matches) {
        const fileLine = Number(match[1])
        if (!Number.isFinite(fileLine)) continue

        const lineNumber = fileLine - bodyStartLine + 1
        if (lineNumber >= 1 && lineNumber <= lines.length) {
            return { lineNumber, line: lines[lineNumber - 1].trim() }
        }
    }
    return { lineNumber: null, line: null }
}

function javaFailAll(tests: PracticeTestCase[], mode: PracticeRunMode, message: string, startedAt: number): PracticeRunResult {
    const runtimeMs = Math.round((performance.now() - startedAt) * 100) / 100
    return {
        ok: false,
        mode,
        passed: 0,
        total: tests.length,
        runtimeMs,
        memoryKb: 0,
        results: tests.map((testCase) => ({
            name: testCase.name,
            visibility: testCase.visibility,
            passed: false,
            durationMs: 0,
            stdout: "",
            stderr: "",
            error: message,
            description: testCase.description,
            input: testCase.input,
            expected: testCase.expected,
            feedback: testCase.feedback,
        })),
    }
}

async function runJavaCode({
    problem,
    code,
    mode,
    language,
    customTests,
}: {
    problem: PracticeProblem
    code: string
    mode: PracticeRunMode
    language: PracticeLanguage
    customTests?: PracticeTestCase[]
}): Promise<PracticeRunResult> {
    const languageBundle = resolveLanguageBundle(problem, language)
    if (!languageBundle) {
        return {
            ok: false,
            mode,
            passed: 0,
            total: 0,
            runtimeMs: 0,
            memoryKb: 0,
            results: [],
            error: `Unsupported language: ${language}`,
        }
    }

    const tests = customTests?.length
        ? customTests
        : languageBundle.testCases.filter((testCase) => mode === "submit" || testCase.visibility === "sample")
    const workDir = mkdtempSync(join(tmpdir(), "leetllm-practice-"))
    const timeoutMs = Math.max(problem.timeLimitMs, 1000)
    const startedAt = performance.now()
    const customTestValidationError = customTests
        ?.map((testCase) => validateJavaSource(testCase.code ?? ""))
        .find((error): error is string => Boolean(error))
    const validationError = validateJavaSource(code) || customTestValidationError

    if (validationError) {
        rmSync(workDir, { recursive: true, force: true })
        return javaFailAll(tests, mode, validationError, startedAt)
    }

    try {
        writeFileSync(join(workDir, "Solution.java"), code, "utf-8")
        const prelude = getPracticeLanguagePrelude(language)
        const testSources = tests.map((testCase, index) => {
            const built = buildJavaTestSource(index, testCase, prelude)
            writeFileSync(join(workDir, `${javaTestClassName(index)}.java`), built.source, "utf-8")
            return built
        })

        const compile = await runProcess({
            command: "javac",
            args: [
                "-J-Xmx128m",
                "-proc:none",
                "-encoding",
                "UTF-8",
                "Solution.java",
                ...tests.map((_, index) => `${javaTestClassName(index)}.java`),
            ],
            cwd: workDir,
            env: javaSandboxEnvironment(workDir),
            timeoutMs: JAVA_COMPILE_TIMEOUT_MS,
        })
        if (compile.timedOut) {
            return javaFailAll(tests, mode, `Timed out compiling after ${JAVA_COMPILE_TIMEOUT_MS}ms`, startedAt)
        }
        if (compile.outputLimitExceeded) {
            return javaFailAll(tests, mode, "Compiler output exceeded limit", startedAt)
        }
        if (compile.error || compile.exitCode !== 0) {
            return javaFailAll(tests, mode, (compile.error || compile.stderr || compile.stdout || "Compilation failed").slice(-4000), startedAt)
        }

        const compiledValidationError = validateCompiledJavaClasses(workDir, tests.length)
        if (compiledValidationError) {
            return javaFailAll(tests, mode, compiledValidationError, startedAt)
        }

        const results: PracticeCaseResult[] = []
        const executionDeadline = performance.now() + timeoutMs
        let executionTimedOut = false
        for (const [index, testCase] of tests.entries()) {
            const className = javaTestClassName(index)
            const caseStarted = performance.now()
            const remainingMs = Math.ceil(executionDeadline - caseStarted)
            if (executionTimedOut || remainingMs <= 0) {
                results.push({
                    name: testCase.name,
                    visibility: testCase.visibility,
                    passed: false,
                    durationMs: 0,
                    stdout: "",
                    stderr: "",
                    error: `Timed out after ${timeoutMs}ms`,
                    description: testCase.description,
                    input: testCase.input,
                    expected: testCase.expected,
                    feedback: testCase.feedback,
                })
                continue
            }
            const run = await runProcess({
                command: "java",
                args: [
                    "-Xms16m",
                    `-Xmx${Math.min(Math.max(problem.memoryLimitMb, 64), 256)}m`,
                    "-Xss512k",
                    "-XX:ActiveProcessorCount=1",
                    "-XX:MaxMetaspaceSize=64m",
                    "-XX:+UseSerialGC",
                    `-Djava.io.tmpdir=${workDir}`,
                    `-Duser.dir=${workDir}`,
                    `-Duser.home=${workDir}`,
                    "-Djava.net.useSystemProxies=false",
                    "-ea",
                    className,
                ],
                cwd: workDir,
                env: javaSandboxEnvironment(workDir),
                timeoutMs: remainingMs,
            })
            if (run.timedOut) executionTimedOut = true
            const error = run.timedOut
                ? `Timed out after ${timeoutMs}ms`
                : run.outputLimitExceeded
                    ? "Output exceeded limit"
                : run.error || (run.exitCode === 0 ? undefined : (run.stderr || run.stdout || `Exited with code ${run.exitCode}`).slice(-4000))
            const assertion = error ? parseJavaAssertion(`${run.stderr}\n${run.stdout}\n${error}`) : null
            const failedLine = error ? javaFailureLine(run.stderr, className, testSources[index].body, testSources[index].bodyStartLine) : { lineNumber: null, line: null }
            results.push({
                name: testCase.name,
                visibility: testCase.visibility,
                passed: !error,
                durationMs: Math.round((performance.now() - caseStarted) * 100) / 100,
                stdout: run.stdout.slice(-4000),
                stderr: run.stderr.slice(-4000),
                error,
                errorLineNumber: failedLine.lineNumber,
                errorLine: failedLine.line,
                description: testCase.description,
                input: testCase.input || assertion?.input,
                expected: testCase.expected || assertion?.expected,
                feedback: testCase.feedback,
                assertion,
            })
        }

        const passed = results.filter((result) => result.passed).length
        return {
            ok: passed === results.length,
            mode,
            passed,
            total: results.length,
            runtimeMs: Math.round((performance.now() - startedAt) * 100) / 100,
            memoryKb: 0,
            results,
        }
    } finally {
        rmSync(workDir, { recursive: true, force: true })
    }
}

export async function runPracticeSpec({
    spec,
    code,
    mode,
    customTests,
}: {
    spec: PracticeExecutionSpec
    code: string
    mode: PracticeRunMode
    customTests?: PracticeTestCase[]
}): Promise<PracticeRunResult> {
    const syntheticProblem = {
        id: spec.slug,
        slug: spec.slug,
        title: spec.slug,
        difficulty: "Medium",
        category: "Sandbox",
        language: spec.language,
        timeEstimateMinutes: 15,
        timeLimitMs: spec.timeLimitMs,
        memoryLimitMb: spec.memoryLimitMb,
        order: 0,
        tags: [],
        source: "sandbox",
        summary: "",
        starterCode: "",
        body: "",
        clarifyingQuestions: [],
        followUps: [],
        followUpGuide: "",
        complexityAnalysis: "",
        solutionGuide: "",
        testCases: spec.testCases,
        languages: {
            [spec.language]: {
                starterCode: "",
                testCases: spec.testCases,
                solutionGuide: "",
            },
        },
    } as PracticeProblem

    return runPracticeCode({
        problem: syntheticProblem,
        code,
        mode,
        language: spec.language,
        customTests,
    })
}

export async function runPracticeCode({
    problem,
    code,
    mode,
    language = problem.language,
    customTests,
}: {
    problem: PracticeProblem
    code: string
    mode: PracticeRunMode
    language?: PracticeLanguage
    customTests?: PracticeTestCase[]
}): Promise<PracticeRunResult> {
    if (language === "java") {
        return runJavaCode({ problem, code, mode, language, customTests })
    }
    return runPythonCode({ problem, code, mode, language, customTests })
}
