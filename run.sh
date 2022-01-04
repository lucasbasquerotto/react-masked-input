#!/bin/bash
docker run --rm -it \
    -p 3000:3000 \
    -e NODE_OPTIONS=--openssl-legacy-provider \
    -v "$(pwd)":/main \
    -w /main \
    -u node \
    node:17.1.0 /bin/bash