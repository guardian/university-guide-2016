#!/bin/bash

./process.py rank2015 guardianHeiTitle guardianScore percentSatisfiedWithAssessment percentSatisfiedWithTeaching studentStaffRatio expenditurePerStudent averageEntryTariff valueAdded careerProspects < data/institutionalRankings.json > src/js/data/institutionalRankings.json
