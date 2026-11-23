#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["tinker @ git+https://github.com/thinking-machines-lab/tinker.git@0ce5bf2484891570b59f8d330a2daf793646917e"]
# ///
"""Offline SDK contracts. Dependency installation needs network, execution does not.

No ServiceClient, API key, HTTP transport, or hosted model is created.
The bare TrainingClient receives a local holder with configuration only.
"""
import argparse
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import tinker
from tinker import types
from tinker.lib.public_interfaces.training_client import TrainingClient
from tinker.proto import tinker_public_pb2 as pb
from tinker.proto.request_conv import forward_backward_request_to_proto
from tinker.types.client_config_response import ClientConfigResponse

REVISION = "0ce5bf2484891570b59f8d330a2daf793646917e"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    checks = []
    datum = types.Datum(
        model_input=types.ModelInput.from_ints([10, 11, 20]),
        loss_fn_inputs={"target_tokens": [11, 20, 21], "weights": [0, 1, 1]},
    )
    assert datum.loss_fn_inputs["target_tokens"].dtype == "int64"
    assert datum.loss_fn_inputs["weights"].dtype == "float32"
    checks.append("Datum converts target and weight tensors to wire dtypes")
    request = types.ForwardBackwardRequest(
        model_id="offline-only", seq_id=7,
        forward_backward_input=types.ForwardBackwardInput(data=[datum], loss_fn="cross_entropy"),
    )
    wire = forward_backward_request_to_proto(request)
    parsed = pb.ForwardBackwardRequest.FromString(wire.SerializeToString())
    assert parsed.seq_id == 7 and parsed.loss_fn == "cross_entropy"
    np.testing.assert_array_equal(np.frombuffer(parsed.data[0].loss_fn_inputs["target_tokens"].dense, dtype=np.int64), [11, 20, 21])
    np.testing.assert_array_equal(np.frombuffer(parsed.data[0].loss_fn_inputs["weights"].dense, dtype=np.float32), [0, 1, 1])
    checks.append("protobuf roundtrip preserves sequence ID and first-answer weight")

    # Deliberately no transport: these private methods only read config and counters.
    holder = SimpleNamespace(_client_config=ClientConfigResponse(fwdbwd_max_chunk_len=2))
    client = TrainingClient(holder, 0, "offline-only")
    chunks = client._chunked_requests([datum] * 5)
    assert [len(chunk) for _, chunk, _ in chunks] == [2, 2, 1]
    assert [request_id for request_id, _, _ in chunks] == [0, 1, 2]
    assert client._get_request_id() == 3
    checks.append("count chunking preserves order and advances request counter")
    holder._client_config = ClientConfigResponse(fwdbwd_max_chunk_bytes_count=1)
    chunks = list(client._chunked_requests_generator([datum, datum]))
    assert len(chunks) == 2 and all(len(chunk) == 1 and size > 1 for chunk, size in chunks)
    checks.append("an oversized individual datum is not split or rejected by chunker")
    assert list(client._chunked_requests_generator([])) == []
    checks.append("empty input produces no chunks")

    # SDK construction is not an alignment validator: this mismatch is accepted.
    malformed = types.Datum(model_input=types.ModelInput.from_ints([10]),
                            loss_fn_inputs={"target_tokens": [11, 20], "weights": [1, 1]})
    assert len(malformed.loss_fn_inputs["target_tokens"].data) == 2
    checks.append("Datum construction alone accepts misaligned token lengths")
    source_root = Path(tinker.__file__).parent
    source_paths = ("lib/public_interfaces/training_client.py", "types/datum.py", "proto/request_conv.py")
    receipt = {
        "sdk_revision": REVISION,
        "sdk_version": tinker.__version__,
        "scope": "local SDK methods and protobuf only; no HTTP, GPU, sampling, or training",
        "source_sha256": {p: hashlib.sha256((source_root / p).read_bytes()).hexdigest() for p in source_paths},
        "checks": checks,
        "passed": len(checks),
    }
    rendered = json.dumps(receipt, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered)
    print(rendered, end="")


if __name__ == "__main__":
    main()
