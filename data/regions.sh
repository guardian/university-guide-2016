#!/bin/bash

tmp=$(mktemp)

# Get european region names
cat institutionDetails.json | jq -r '.[] | .postcode' | tr -d ' ' |
    sed 's#^#http://mapit.mysociety.org/postcode/#' |
    wget -i - -w1 -O - | sed 's#}{#}\n{#' |
    jq '.areas | to_entries[] | select(.value.type == "EUR") | .value.name' > $tmp

# Join with institution IDs
cat institutionDetails.json | jq '.[] | .institutionId' |
    paste -d: - $tmp -d: | tr '\n' ',' | sed 's#^#{#' | sed 's#,$#}#' |
    # Map official region names to what we are using
    sed 's#\(East\|West\)"#\1 England"#g' | sed 's#Eastern#East of England#g' > regions.json

rm $tmp
