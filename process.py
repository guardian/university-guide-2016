#!/usr/bin/python
import sys, json, csv
from copy import copy
from collections import defaultdict

institutionDetails = {i['institutionId']: i for i in json.load(open('data/institutionDetails.json'))}
institutionLinks = {i['name'].strip(): i['url'] for i in csv.DictReader(open('data/institutionLinks.csv'))}
institutionalRankings = {i['institutionId']: i for i in json.load(open('data/institutionalRankings.json'))}
subjectNames = {s['gsgId']: s['guardianSubjectGroup'] for s in json.load(open('data/guardianSubjectGroups.json'))}
subjectLinks = {s['name'].lower(): s['url'] for s in csv.DictReader(open('data/subjectLinks.csv'))}
courses = json.load(open('data/courses.json'))

# munge together all the data we have on institutions
institutions = {}
for id, institution in institutionDetails.iteritems():
    institution = copy(institution)

    if institution['guardianHeiTitle'] == 'Glynd?r':
        institution['guardianHeiTitle'] = 'Glyndwr'

    if id in institutionalRankings:
        institution.update(institutionalRankings[id])

        if institution.get('rank2015', '').isdigit():
            institution['rank2015'] = '(' + institution['rank2015'] + ')'

    institution['link'] = institutionLinks.get(institution['guardianHeiTitle'], '')

    institutions[id] = institution

def get_courses(iId, gsgId):
    return [[x['url'], x['courseTitle']] for x in courses if x['gsgId'] == gsgId and x['instId'] == iId]

subjectInstitutions = defaultdict(dict)
for s in json.load(open('data/unrankedProviderList.json')) + json.load(open('data/rankingsList.json')):
    subjectInstitutions[s['gsgId']][s['institutionId']] = s

subjects = {}
for gsgId, name in subjectNames.iteritems():
    subjectInstitutionIds = set([c['instId'] for c in courses if c['gsgId'] == gsgId])

    myInsts = []
    for id in subjectInstitutionIds:
        institution = copy(subjectInstitutions[gsgId].get(id, {'institutionId': id}))
        institution['guardianHeiTitle'] = institutions[id]['guardianHeiTitle']
        institution['link'] = institutionLinks.get(institution['guardianHeiTitle'], '')
        institution['courses'] = get_courses(id, gsgId)
        myInsts.append(institution)

    subjects[gsgId] = {
        'name': name,
        'link': subjectLinks[name.lower()],
        'institutions': myInsts
    }

################ GENERATE JSON ################

def pick(row, fields):
    # round any floats
    def approx(field):
        if not field:
            field = '-'
        try:
            f = float(field)
            if int(f) != f:
                return '%.1f' % f
        except ValueError:
            pass
        return field

    return [approx(row[field]) if field in row else '' for field in fields]

common_fields = ('guardianHeiTitle', 'guardianScore', 'percentSatisfiedOverall',
    'percentSatisfiedWithTeaching', 'percentSatisfiedWithAssessment', 'studentStaffRatio',
    'expenditurePerStudent', 'averageEntryTariff', 'valueAdded', 'careerProspects', 'link')

# Institution ranking

institutions_fields = ('institutionId', 'rank2016', 'rank2015') + common_fields
institutions_out = {id: pick(institution, institutions_fields) for id, institution in institutions.iteritems()}
with open('src/js/data/institutions.json', 'w') as f:
    json.dump(institutions_out, f)

# Subject ranking

subject_fields = ('institutionId', 'rank', '') + common_fields

def subject_sort(a, b):
    if not a.get('rank'):
        return 1
    elif not b.get('rank'):
        return -1
    else:
        return int(a['rank']) - int(b['rank'])

for gsgId, subject in subjects.iteritems():
    institutions_out = [pick(institution, subject_fields) for institution in sorted(subject['institutions'], cmp=subject_sort)]
    courses_out = {institution['institutionId']: institution['courses'] for institution in subject['institutions']}
    with open('src/assets/subjects/%s.json' % gsgId, 'w') as f:
        json.dump({
            'institutions': institutions_out,
            'link': subject['link'],
            'courses': courses_out
        }, f)

# Subject names

with open('src/js/data/subjectNames.json', 'w') as f:
    json.dump(subjectNames, f)
