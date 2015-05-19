import _ from 'lodash';
import fs from 'fs';


// RANKINGS
var rankingsRaw = JSON.parse(fs.readFileSync('./data/rankingsList.json'));

var rankings = _(rankingsRaw)
    .groupBy('gsgId')
    .mapValues(val => {
        return _(val).groupBy('institutionId').mapValues(v => v[0].rank).valueOf();
    })
    .valueOf();


// COURSES
    // "url": "http://www.hud.ac.uk/courses/2014-15/00000025",
    // "courseTitle": "BSc (hons) physiotherapy (optional foundation year)",
    // "gsgId": "S040",
    // "instId": "0061",

var coursesRaw = JSON.parse(fs.readFileSync('./data/courses.json'));

var courses = coursesRaw.map(function(c) {
    return {
        url: c.url,
        name: c.courseTitle,
        gsgId: c.gsgId,
        instId: c.instId
    };
});

var out = {
    regions: JSON.parse(fs.readFileSync('./data/regions.json')),
    rankings: rankings,
    courses: courses
}

fs.writeFileSync('./src/assets/search.json', JSON.stringify(out, null, ''));
