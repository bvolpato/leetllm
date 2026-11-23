import { readFileSync, readdirSync } from "fs"
import { basename, join } from "path"

const ALLOWED_JAVA_CLASSES = new Set([
    "java/io/Serializable",
    "java/lang/Appendable",
    "java/lang/ArithmeticException",
    "java/lang/ArrayIndexOutOfBoundsException",
    "java/lang/AssertionError",
    "java/lang/AutoCloseable",
    "java/lang/Boolean",
    "java/lang/Byte",
    "java/lang/CharSequence",
    "java/lang/Character",
    "java/lang/Cloneable",
    "java/lang/Comparable",
    "java/lang/Deprecated",
    "java/lang/Double",
    "java/lang/Enum",
    "java/lang/Error",
    "java/lang/Exception",
    "java/lang/Float",
    "java/lang/FunctionalInterface",
    "java/lang/IllegalArgumentException",
    "java/lang/IllegalStateException",
    "java/lang/IndexOutOfBoundsException",
    "java/lang/Integer",
    "java/lang/Iterable",
    "java/lang/Long",
    "java/lang/Math",
    "java/lang/NegativeArraySizeException",
    "java/lang/NullPointerException",
    "java/lang/Number",
    "java/lang/NumberFormatException",
    "java/lang/Object",
    "java/lang/Override",
    "java/lang/Record",
    "java/lang/Runnable",
    "java/lang/RuntimeException",
    "java/lang/SafeVarargs",
    "java/lang/Short",
    "java/lang/StrictMath",
    "java/lang/String",
    "java/lang/StringBuffer",
    "java/lang/StringBuilder",
    "java/lang/StringIndexOutOfBoundsException",
    "java/lang/SuppressWarnings",
    "java/lang/Throwable",
    "java/lang/UnsupportedOperationException",
    "java/lang/Void",
    "java/lang/invoke/CallSite",
    "java/lang/invoke/LambdaMetafactory",
    "java/lang/invoke/MethodHandle",
    "java/lang/invoke/MethodHandles",
    "java/lang/invoke/MethodHandles$Lookup",
    "java/lang/invoke/MethodType",
    "java/lang/invoke/StringConcatFactory",
    "java/lang/invoke/TypeDescriptor",
    "java/lang/runtime/ObjectMethods",
    "java/math/BigInteger",
    "java/util/AbstractCollection",
    "java/util/AbstractList",
    "java/util/AbstractMap",
    "java/util/AbstractQueue",
    "java/util/AbstractSequentialList",
    "java/util/AbstractSet",
    "java/util/ArrayDeque",
    "java/util/ArrayList",
    "java/util/Arrays",
    "java/util/BitSet",
    "java/util/Collection",
    "java/util/Collections",
    "java/util/Comparator",
    "java/util/ConcurrentModificationException",
    "java/util/Deque",
    "java/util/Dictionary",
    "java/util/DoubleSummaryStatistics",
    "java/util/DuplicateFormatFlagsException",
    "java/util/EmptyStackException",
    "java/util/Enumeration",
    "java/util/EnumMap",
    "java/util/EnumSet",
    "java/util/HashMap",
    "java/util/HashSet",
    "java/util/IdentityHashMap",
    "java/util/IntSummaryStatistics",
    "java/util/Iterator",
    "java/util/LinkedHashMap",
    "java/util/LinkedHashSet",
    "java/util/LinkedList",
    "java/util/List",
    "java/util/ListIterator",
    "java/util/Locale",
    "java/util/LongSummaryStatistics",
    "java/util/Map",
    "java/util/Map$Entry",
    "java/util/NavigableMap",
    "java/util/NavigableSet",
    "java/util/NoSuchElementException",
    "java/util/Objects",
    "java/util/Optional",
    "java/util/OptionalDouble",
    "java/util/OptionalInt",
    "java/util/OptionalLong",
    "java/util/PrimitiveIterator",
    "java/util/PrimitiveIterator$OfDouble",
    "java/util/PrimitiveIterator$OfInt",
    "java/util/PrimitiveIterator$OfLong",
    "java/util/PriorityQueue",
    "java/util/Queue",
    "java/util/Random",
    "java/util/Set",
    "java/util/SortedMap",
    "java/util/SortedSet",
    "java/util/Spliterator",
    "java/util/Spliterator$OfDouble",
    "java/util/Spliterator$OfInt",
    "java/util/Spliterator$OfLong",
    "java/util/Spliterators",
    "java/util/Stack",
    "java/util/StringJoiner",
    "java/util/TreeMap",
    "java/util/TreeSet",
    "java/util/Vector",
])

const ALLOWED_JAVA_CLASS_PREFIXES = [
    "java/util/function/",
    "java/util/regex/",
    "java/util/stream/",
]

const BLOCKED_JAVA_NAMESPACES = [
    "com.sun",
    "java.awt",
    "java.beans",
    "java.io",
    "java.lang.instrument",
    "java.lang.invoke",
    "java.lang.management",
    "java.lang.reflect",
    "java.net",
    "java.nio",
    "java.rmi",
    "java.security",
    "java.sql",
    "java.util.concurrent",
    "javax",
    "jdk",
    "sun",
]

const BLOCKED_JAVA_IDENTIFIERS = [
    "CallSite",
    "Class",
    "ClassLoader",
    "LambdaMetafactory",
    "MethodHandle",
    "MethodHandles",
    "MethodType",
    "Module",
    "ObjectMethods",
    "Package",
    "ProcessBuilder",
    "Runtime",
    "SecurityManager",
    "ServiceLoader",
    "StackWalker",
    "StringConcatFactory",
    "System",
    "Thread",
    "ThreadGroup",
    "Timer",
    "TimerTask",
    "Unsafe",
    "VarHandle",
]

// Compiler-emitted invokedynamic bootstrap descriptors may reference these
// types in class descriptors or BootstrapMethods, but user bytecode must never
// directly invoke methods or access fields on them.
const BLOCKED_DIRECT_JAVA_MEMBER_OWNERS = new Set([
    "java/lang/Class",
    "java/lang/invoke/CallSite",
    "java/lang/invoke/MethodHandle",
    "java/lang/invoke/MethodHandles",
    "java/lang/invoke/MethodHandles$Lookup",
    "java/lang/invoke/MethodType",
])

const SAFE_JAVA_CLASS_LITERALS = new Set([
    "ArithmeticException",
    "ArrayIndexOutOfBoundsException",
    "AssertionError",
    "ConcurrentModificationException",
    "DuplicateFormatFlagsException",
    "EmptyStackException",
    "Error",
    "Exception",
    "IllegalArgumentException",
    "IllegalStateException",
    "IndexOutOfBoundsException",
    "NegativeArraySizeException",
    "NoSuchElementException",
    "NullPointerException",
    "NumberFormatException",
    "RuntimeException",
    "StringIndexOutOfBoundsException",
    "Throwable",
    "UnsupportedOperationException",
])

function stripJavaCommentsAndLiterals(source: string) {
    let result = ""
    let index = 0
    let state: "code" | "line-comment" | "block-comment" | "string" | "char" | "text-block" = "code"

    while (index < source.length) {
        const char = source[index]
        const next = source[index + 1]
        const third = source[index + 2]

        if (state === "code") {
            if (char === "/" && next === "/") {
                result += "  "
                index += 2
                state = "line-comment"
                continue
            }
            if (char === "/" && next === "*") {
                result += "  "
                index += 2
                state = "block-comment"
                continue
            }
            if (char === '"' && next === '"' && third === '"') {
                result += "   "
                index += 3
                state = "text-block"
                continue
            }
            if (char === '"') {
                result += " "
                index += 1
                state = "string"
                continue
            }
            if (char === "'") {
                result += " "
                index += 1
                state = "char"
                continue
            }
            result += char
            index += 1
            continue
        }

        if (state === "line-comment") {
            result += char === "\n" ? "\n" : " "
            index += 1
            if (char === "\n") state = "code"
            continue
        }

        if (state === "block-comment") {
            result += char === "\n" ? "\n" : " "
            index += 1
            if (char === "*" && next === "/") {
                result += " "
                index += 1
                state = "code"
            }
            continue
        }

        if (state === "text-block") {
            if (char === '"' && next === '"' && third === '"') {
                result += "   "
                index += 3
                state = "code"
            } else {
                result += char === "\n" ? "\n" : " "
                index += 1
            }
            continue
        }

        result += char === "\n" ? "\n" : " "
        index += 1
        if (char === "\\" && index < source.length) {
            result += source[index] === "\n" ? "\n" : " "
            index += 1
        } else if ((state === "string" && char === '"') || (state === "char" && char === "'")) {
            state = "code"
        }
    }

    return result
}

export function validateJavaSource(source: string): string | null {
    const translatedSource = source.replace(/\\u+([0-9a-fA-F]{4})/g, (_, codePoint: string) => (
        String.fromCharCode(Number.parseInt(codePoint, 16))
    ))
    const code = stripJavaCommentsAndLiterals(translatedSource)
    if (/\bpackage\s+/.test(code)) return "Java source uses blocked API: package"
    if (/\bnative\b/.test(code)) return "Java source uses blocked API: native"
    for (const match of code.matchAll(/\b((?:[A-Za-z_$][A-Za-z0-9_$]*\.)*[A-Za-z_$][A-Za-z0-9_$]*)\s*\.\s*class\b/g)) {
        const className = match[1].split(".").at(-1) ?? ""
        if (!SAFE_JAVA_CLASS_LITERALS.has(className)) return "Java source uses blocked API: class literal"
    }
    if (/\b(?:forName|getClass|getClassLoader|loadClass|getDeclared[A-Za-z0-9_$]*|getMethod|getMethods|getField|getFields|getConstructor|getConstructors|getProtectionDomain|getResource|getResourceAsStream|getModule|newInstance|asSubclass)\s*\(/.test(code)) {
        return "Java source uses blocked API: class inspection"
    }

    for (const namespace of BLOCKED_JAVA_NAMESPACES) {
        const pattern = new RegExp(`\\b${namespace.replaceAll(".", "\\.")}(?:\\.|\\b)`)
        if (pattern.test(code)) return `Java source uses blocked namespace: ${namespace}`
    }

    for (const identifier of BLOCKED_JAVA_IDENTIFIERS) {
        if (new RegExp(`\\b${identifier}\\b`).test(code)) {
            return `Java source uses blocked API: ${identifier}`
        }
    }

    return null
}

type ConstantPoolEntry =
    | { tag: "utf8"; value: string }
    | { tag: "class"; nameIndex: number }
    | { tag: "descriptor"; descriptorIndex: number }
    | { tag: "memberref"; classIndex: number }
    | { tag: "other" }
    | undefined

function readClassReferences(path: string) {
    const bytes = readFileSync(path)
    if (bytes.length < 10 || bytes.readUInt32BE(0) !== 0xcafebabe) {
        throw new Error(`Invalid Java class file: ${basename(path)}`)
    }

    const entries: ConstantPoolEntry[] = new Array(bytes.readUInt16BE(8))
    let offset = 10
    for (let index = 1; index < entries.length; index += 1) {
        const tag = bytes.readUInt8(offset)
        offset += 1
        if (tag === 1) {
            const length = bytes.readUInt16BE(offset)
            offset += 2
            entries[index] = { tag: "utf8", value: bytes.toString("utf8", offset, offset + length) }
            offset += length
        } else if (tag === 7) {
            entries[index] = { tag: "class", nameIndex: bytes.readUInt16BE(offset) }
            offset += 2
        } else if (tag === 3 || tag === 4) {
            entries[index] = { tag: "other" }
            offset += 4
        } else if (tag === 5 || tag === 6) {
            entries[index] = { tag: "other" }
            offset += 8
            index += 1
        } else if (tag === 8 || tag === 19 || tag === 20) {
            entries[index] = { tag: "other" }
            offset += 2
        } else if (tag === 12) {
            entries[index] = { tag: "descriptor", descriptorIndex: bytes.readUInt16BE(offset + 2) }
            offset += 4
        } else if (tag === 16) {
            entries[index] = { tag: "descriptor", descriptorIndex: bytes.readUInt16BE(offset) }
            offset += 2
        } else if (tag === 9 || tag === 10 || tag === 11) {
            entries[index] = { tag: "memberref", classIndex: bytes.readUInt16BE(offset) }
            offset += 4
        } else if (tag === 17 || tag === 18) {
            entries[index] = { tag: "other" }
            offset += 4
        } else if (tag === 15) {
            entries[index] = { tag: "other" }
            offset += 3
        } else {
            throw new Error(`Unsupported Java class constant tag ${tag}`)
        }
        if (offset > bytes.length) throw new Error(`Truncated Java class file: ${basename(path)}`)
    }

    const descriptorIndexes = new Set<number>()
    for (const entry of entries) {
        if (entry?.tag === "descriptor") descriptorIndexes.add(entry.descriptorIndex)
    }

    function readUInt16() {
        if (offset + 2 > bytes.length) throw new Error(`Truncated Java class file: ${basename(path)}`)
        const value = bytes.readUInt16BE(offset)
        offset += 2
        return value
    }

    function readUInt32() {
        if (offset + 4 > bytes.length) throw new Error(`Truncated Java class file: ${basename(path)}`)
        const value = bytes.readUInt32BE(offset)
        offset += 4
        return value
    }

    function scanAttributes() {
        const count = readUInt16()
        for (let index = 0; index < count; index += 1) {
            const nameIndex = readUInt16()
            const length = readUInt32()
            const name = entries[nameIndex]
            if (name?.tag === "utf8" && name.value === "Signature" && length === 2) {
                descriptorIndexes.add(readUInt16())
            } else {
                offset += length
                if (offset > bytes.length) throw new Error(`Truncated Java class file: ${basename(path)}`)
            }
        }
    }

    function scanMembers() {
        const count = readUInt16()
        for (let index = 0; index < count; index += 1) {
            offset += 4
            descriptorIndexes.add(readUInt16())
            scanAttributes()
        }
    }

    offset += 6
    const interfaceCount = readUInt16()
    offset += interfaceCount * 2
    scanMembers()
    scanMembers()
    scanAttributes()

    const references = new Set<string>()
    const memberOwners = new Set<string>()
    for (const entry of entries) {
        if (entry?.tag === "class") {
            const name = entries[entry.nameIndex]
            if (name?.tag === "utf8") references.add(name.value)
        } else if (entry?.tag === "memberref") {
            const ownerClass = entries[entry.classIndex]
            if (ownerClass?.tag === "class") {
                const name = entries[ownerClass.nameIndex]
                if (name?.tag === "utf8") memberOwners.add(name.value)
            }
        }
    }
    for (const descriptorIndex of descriptorIndexes) {
        const descriptor = entries[descriptorIndex]
        if (descriptor?.tag !== "utf8") continue
        for (const match of descriptor.value.matchAll(/L([A-Za-z0-9_$\/]+)(?=[;<])/g)) {
            references.add(match[1])
        }
    }
    return { references, memberOwners }
}

function isAllowedJavaClass(name: string) {
    const objectArray = name.match(/^\[+L(.+);$/)
    if (objectArray) return isAllowedJavaClass(objectArray[1])
    if (/^\[+[BCDFIJSZ]$/.test(name)) return true
    if (!name.includes("/")) return !/^TestCase\d+(?:\$|$)/.test(name)
    return ALLOWED_JAVA_CLASSES.has(name)
        || ALLOWED_JAVA_CLASS_PREFIXES.some((prefix) => name.startsWith(prefix))
}

function isTrustedTestHarnessClass(filename: string, testCount: number) {
    for (let index = 1; index <= testCount; index += 1) {
        if (filename === `TestCase${index}.class` || filename === `TestCase${index}$ThrowingRunnable.class`) {
            return true
        }
    }
    return false
}

function isTrustedTestHarnessReference(reference: string, testCount: number) {
    if (reference === "java/lang/Class" || reference === "java/util/Base64" || reference === "java/util/Base64$Encoder") {
        return true
    }
    for (let index = 1; index <= testCount; index += 1) {
        if (reference === `TestCase${index}` || reference === `TestCase${index}$ThrowingRunnable`) return true
    }
    return false
}

export function validateCompiledJavaClasses(workDir: string, testCount: number): string | null {
    const classFiles = readdirSync(workDir)
        .filter((filename) => filename.endsWith(".class"))
    if (classFiles.length > 64) return "Java source creates too many classes"

    try {
        for (const filename of classFiles) {
            const { references, memberOwners } = readClassReferences(join(workDir, filename))
            const isTrustedHarness = isTrustedTestHarnessClass(filename, testCount)
            const isCompilerGeneratedRecord = references.has("java/lang/Record")
                && references.has("java/lang/runtime/ObjectMethods")
            if (!isTrustedHarness) {
                for (const owner of memberOwners) {
                    if (BLOCKED_DIRECT_JAVA_MEMBER_OWNERS.has(owner)) {
                        return `Java source invokes blocked class: ${owner.replaceAll("/", ".")}`
                    }
                }
            }
            for (const reference of references) {
                if (reference === "java/lang/Class" && isCompilerGeneratedRecord) continue
                if (isTrustedHarness && isTrustedTestHarnessReference(reference, testCount)) continue
                if (!isAllowedJavaClass(reference)) {
                    return `Java source uses unsupported class: ${reference.replaceAll("/", ".")}`
                }
            }
        }
    } catch {
        return "Java class validation failed"
    }

    return null
}

export function javaSandboxEnvironment(workDir: string): NodeJS.ProcessEnv {
    return {
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
        NODE_ENV: "production",
        PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
        TMPDIR: workDir,
        TZ: "UTC",
    }
}
