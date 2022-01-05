#!/bin/bash
set -eou pipefail

port=( -p '3000:3000' )

if [ "${1:-}" = '--noport' ]; then
    port=()
fi

docker run --rm -it \
    ${port+"${port[@]}"} \
    -e NODE_OPTIONS=--openssl-legacy-provider \
    -v "$(pwd)":/main \
    -w /main \
    -u node \
    node:17.1.0 /bin/bash