#!/bin/bash

tmp=$(mktemp)

cat institutionDetails.json | jq -r '.[] | .postcode' | tr -d ' ' |
    sed 's#^#http://mapit.mysociety.org/postcode/#' |
    wget -i - -w1 -O - | sed 's#}{#}\n{#' |
    jq '.areas | to_entries[] | select(.value.type == "EUR") | .value.name' > $tmp

cat institutionDetails.json | jq '.[] | .institutionId' |
    paste -d: - $tmp -d: | tr '\n' ',' | sed 's#^#{#' | sed 's#,$#}#' > regions.json

rm $tmp
