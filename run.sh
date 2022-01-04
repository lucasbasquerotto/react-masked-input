#!/bin/bash
docker run --rm -it -v "$(pwd)":/main -w /main -p 3000:3000 node:17.1.0 /bin/bash