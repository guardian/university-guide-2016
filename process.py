#!/usr/bin/python
import sys, json, csv
from copy import copy
from collections import defaultdict

institutionDetails = {i['institutionId']: i for i in json.load(open('data/institutionDetails.json'))}
institutionLinks = {i['name'].strip(): i['url'] for i in csv.DictReader(open('data/institutionLinks.csv'))}
institutionalRankings = {i['institutionId']: i for i in json.load(open('data/institutionalRankings.json'))}
subjectNames = {s['gsgId']: s['guardianSubjectGroup'] for s in json.load(open('data/guardianSubjectGroups.json'))}

# munge together all the data we have on institutions
institutions = {}
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

    institutions[id] = institution

subjects = defaultdict(lambda: {'name': '', 'institutions': []})
for institution in json.load(open('data/rankingsList.json')) + json.load(open('data/unrankedProviderList.json')):
    institution['guardianHeiTitle'] = institutions[institution['institutionId']]['guardianHeiTitle']
    subjects[institution['gsgId']]['name'] = subjectNames[institution['gsgId']]
    subjects[institution['gsgId']]['institutions'].append(institution)

################ GENERATE JSON ################

def pick(row, fields):
    return [row[field] if field in row else '' for field in fields]

common_fields = ('guardianHeiTitle', 'guardianScore',
    'percentSatisfiedWithAssessment', 'percentSatisfiedWithTeaching', 'studentStaffRatio',
    'expenditurePerStudent', 'averageEntryTariff', 'valueAdded', 'careerProspects', 'link')

# Institution ranking

institutions_fields = ('rank2016', 'rank2015') + common_fields

def institutions_sort(a, b):
    if not a.get('rank2016'):
        return 1
    elif not b.get('rank2016'):
        return -1
    else:
        return int(a['rank2016']) - int(b['rank2016'])

institutions_out = [pick(institution, institutions_fields) for institution in sorted(institutions.values(), cmp=institutions_sort)]

with open('src/js/data/institutionalRankings.json', 'w') as f:
    json.dump(institutions_out, f)

# Subject ranking

subject_fields = ('rank',) + common_fields

def subject_sort(a, b):
    if not a.get('rank'):
        return 1
    elif not b.get('rank'):
        return -1
    else:
        return int(a['rank']) - int(b['rank'])

for gsgId, subject in subjects.iteritems():

    institutions_out = [pick(institution, subject_fields) for institution in sorted(subject['institutions'], cmp=subject_sort)]
    with open('src/assets/data/subjects/%s.json' % gsgId, 'w') as f:
        json.dump(institutions_out, f)

# Subject names

with open('src/js/data/subjectNames.json', 'w') as f:
    json.dump(subjectNames, f)
