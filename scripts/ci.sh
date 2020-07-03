#!/usr/bin/env bash

pushd lambda || exit
yarn deploy
popd

