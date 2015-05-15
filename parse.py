#!/usr/bin/python
# Substitutions institutionId for guardianHeiTitle and removes any keys given as args
import sys, json

details = {u['institutionId']: u for u in json.load(open('src/js/data/raw/institutionDetails.json'))}

delete_keys = sys.argv[1:]

def modify(obj):
    obj['guardianHeiTitle'] = details[obj['institutionId']]['guardianHeiTitle']
    for key in filter(lambda key: key in obj, delete_keys):
        del obj[key]
    return obj

data = map(modify, json.load(sys.stdin))
json.dump(data, sys.stdout)
