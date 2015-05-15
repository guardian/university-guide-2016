#!/usr/bin/python
# Substitutions institutionId for guardianHeiTitle and outputs array of arrays
import sys, json

details = {u['institutionId']: u for u in json.load(open('data/institutionDetails.json'))}

delete_keys = sys.argv[1:]

def modify(obj):
    obj['guardianHeiTitle'] = details[obj['institutionId']]['guardianHeiTitle']
    return [obj[key] for key in keys if key in obj]

data = map(modify, json.load(sys.stdin))
json.dump(data, sys.stdout)
