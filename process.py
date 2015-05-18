#!/usr/bin/python
# Substitutions institutionId for guardianHeiTitle and outputs array of arrays
import sys, json, csv
from copy import copy

institutions = []

institutionDetails = {i['institutionId']: i for i in json.load(open('data/institutionDetails.json'))}
institutionLinks = {i['name'].strip(): i['url'] for i in csv.DictReader(open('data/institutionLinks.csv'))}
institutionalRankings = {i['institutionId']: i for i in json.load(open('data/institutionalRankings.json'))}

# munge together all the data we have on institutions
for id, institution in institutionDetails.iteritems():
    institution = copy(institution)

    if institution['guardianHeiTitle'] == 'Glynd?r':
        institution['guardianHeiTitle'] = 'Glyndwr'

    if id in institutionalRankings:
        institution.update(institutionalRankings[id])

    institution['link'] = institutionLinks.get(institution['guardianHeiTitle'], '')

    # round any floats
    for field, value in institution.iteritems():
        try:
            f = float(value or '')
            if int(f) != f:
                institution[field] = '%.1f' % float(value or '')
        except ValueError:
            pass

    institutions.append(institution)

def pick(row, fields):
    return [row[field] if field in row else '' for field in fields]

rankings_fields = ('rank2016', 'rank2015', 'guardianHeiTitle', 'guardianScore',
    'percentSatisfiedWithAssessment', 'percentSatisfiedWithTeaching', 'studentStaffRatio',
    'expenditurePerStudent', 'averageEntryTariff', 'valueAdded', 'careerProspects', 'link')

def rankings_sort(a, b):
    if not a.get('rank2016'):
        return 1
    elif not b.get('rank2016'):
        return -1
    else:
        return int(a['rank2016']) - int(b['rank2016'])

rankings = [pick(institution, rankings_fields) for institution in sorted(institutions, cmp=rankings_sort)]

with open('src/js/data/institutionalRankings.json', 'w') as f:
    json.dump(rankings, f)
