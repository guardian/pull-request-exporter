#!/usr/bin/env bash

set -e

pushd lambda || exit
yarn # Install dependencies
yarn deploy # Deploy to riff-raff
popd

