#!/usr/bin/python
import sys, json, csv
from copy import copy
from collections import defaultdict

institutionDetails = {i['institutionId']: i for i in json.load(open('data/institutionDetails.json'))}
institutionLinks = {i['name'].strip(): i['url'] for i in csv.DictReader(open('data/institutionLinks.csv'))}
institutionalRankings = {i['institutionId']: i for i in json.load(open('data/institutionalRankings.json'))}
subjectNames = {s['gsgId']: s['guardianSubjectGroup'] for s in json.load(open('data/guardianSubjectGroups.json'))}
subjectLinks = {s['name'].lower(): s['url'] for s in csv.DictReader(open('data/subjectLinks.csv'))}
courses = json.load(open('src/assets/courses.json'))

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
    return [x[2] for x in courses if x[3] == gsgId and x[4] == iId]

subjects = defaultdict(lambda: {'name': '', 'institutions': []})
for institution in json.load(open('data/rankingsList.json')) + json.load(open('data/unrankedProviderList.json')):
    iId = institution['institutionId']
    gsgId = institution['gsgId']

    institution['guardianHeiTitle'] = institutions[iId]['guardianHeiTitle']
    institution['link'] = institutionLinks.get(institution['guardianHeiTitle'], '')
    institution['courses'] = get_courses(iId, gsgId)

    name = subjectNames[gsgId]
    subjects[gsgId]['name'] = name
    subjects[gsgId]['link'] = subjectLinks[name.lower()]
    subjects[gsgId]['institutions'].append(institution)

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

common_fields = ('guardianHeiTitle', 'guardianScore',
    'percentSatisfiedWithAssessment', 'percentSatisfiedWithTeaching', 'studentStaffRatio',
    'expenditurePerStudent', 'averageEntryTariff', 'valueAdded', 'careerProspects', 'link')

# Institution ranking

institutions_fields = ('institutionId', 'rank2016', 'rank2015') + common_fields

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
    with open('src/assets/subjects/overall/%s.json' % gsgId, 'w') as f:
        json.dump({'institutions': institutions_out, 'link': subject['link']}, f)


# Per subject course listings

for gsgId, subject in subjects.iteritems():
    institutions_out = {institution['institutionId']: institution['courses'] for institution in subject['institutions']}
    with open('src/assets/subjects/courses/%s.json' % gsgId, 'w') as f:
        json.dump(institutions_out, f)

# Subject names

with open('src/js/data/subjectNames.json', 'w') as f:
    json.dump(subjectNames, f)
