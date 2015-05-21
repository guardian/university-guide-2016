export default class Animation {
            constructor(opts) {
                var el = opts.el;
                this.animationEl = opts.el;
                this.animationEl.innerHTML = this.HTML;
                this.peopleAnimEl = el.querySelector('#peopleAnim')
                this.bg1el = el.querySelector('#bg1')
                this.bg2el = el.querySelector('#bg2')
                this.bg3el = el.querySelector('#bg3')
                this.bg4el = el.querySelector('#bg4')
                this.doAnimate();
            }

            get HTML() {
                return `<div class="head-area">
                        <div class="head-content">
                            <div class="head-content-left">

                            </div>

                            <div class="head-content-main">
                                <h1>University guide</h1>
                                <h2>University guide</h2>
                            </div>    
                         </div> 

                       </div> 

                      <div class="animation-holder">
                        
                        <div class="bg-3"  id="bg3" >
                          
                        </div> 

                        <div class="bg-4"  id="bg4" >
                          
                        </div> 
                        <div class="bg-2"  id="bg2" >
                          
                        </div>  

                        <div class="people" id="peopleAnim">
                            
                        </div>

                        <div class="bg-1" id="bg1" style="background-position:1000px 0">

                        </div> 

                      </div>  `;
            }


            peopleAnimation() {
                this.peopleRef = this.peopleRef-450;
                this.peopleAnimEl.style.backgroundPositionY = this.peopleRef+'px'
            }

            fgAnimation() {
                this.fgRef = this.fgRef-1;
                this.bg1el.style.backgroundPosition = this.fgRef+'px 0'
            }

            bgAnimation() {
                this.bgRef = this.bgRef-1;
                this.bg2el.style.backgroundPosition = this.bgRef+'px 0'
            }

            panelsAnimation() {
                this.panelsRef = this.panelsRef-1;
                this.bg3el.style.backgroundPosition = this.panelsRef+'px 0'
            }

            skylineAnimation() {
                this.skylineRef = this.skylineRef-1;
                this.bg4el.style.backgroundPosition = this.skylineRef+'px 0'
            }


            doAnimate () {

                this.fgRef = 1000;
                this.bgRef = 1000;
                this.peopleRef = 1350;
                this.panelsRef = 1000;
                this.skylineRef = 1000;

                window.int_doAnimation1 = setInterval(this.fgAnimation.bind(this),10);
                window.int_doAnimation2 = setInterval(this.bgAnimation.bind(this),30);
                window.int_doAnimation3 = setInterval(this.panelsAnimation.bind(this),50);
                window.int_doAnimation4 = setInterval(this.peopleAnimation.bind(this),150);
                window.int_doAnimation5 = setInterval(this.skylineAnimation.bind(this),80);
     }

}

// import Subjects from './subjects'
// import { config } from '../lib/cfg'
// import reqwest from 'reqwest'
// import bean from 'fat/bean'
// import bonzo from 'ded/bonzo'

// import institutionalRankings from '../data/institutionalRankings.json!json'
// import subjectNames from '../data/subjectNames.json!json'

// const headers = ['Rank 2016', 'Rank 2015', 'Institution', 'Guardian score/100', 'Satisfied with course',
//     'Satisfied with teaching', /*'Satisfied with feedback',*/ 'Student to staff ratio', 'Spend per student/10',
//     'Average entry tariff', 'Value added score/10', 'Career after 6 months', 'Link'];

// var subjectCache = {'all': {'institutions': institutionalRankings}};

// function preprocessData(data) {
//     if (data.length) {
//         var i = data[0].length-1;
//         return data.map(row => {
//             var copy = row.slice();
//             copy[i] = `<a class="ug16-table__institution-link" href="${row[i]}" target="_blank"></a>`;
//             return copy;
//         })
//     }
// }

// export default class Table {
//     constructor(opts) {
//         this.el = opts.el
//         this.subjectChange = opts.subjectChange

//         this.el.innerHTML = this.HTML;
//         this.$tbodyEl = bonzo(this.el.querySelector('tbody'));

//         bean.on(this.el, 'click', 'tbody tr:not(.ug16-table__unranked-msg)', this.expandSelection.bind(this));

//         this.subjectsComponent = new Subjects({
//             el: this.el.querySelector('select'),
//             change: this.show.bind(this)
//         });
//     }

//     get HTML() {
//         return `<table>
//                     <caption>
//                         <label for="ug16-table__subject">Subject</label>
//                         <select id="ug16-table__subject"></select>
//                         <div class="ug16-table__subject-link"></div>
//                     </caption>
//                     <thead><tr>${this.headersHTML}</tr></thead>
//                     <tbody></tbody>
//                 </table>
//                 <p class="ug16-table__footnote">
//                     Note: dashes are used where there is insufficient data to calculate a ranking position
//                     for a provider delivering courses in this subject area
//                 </p>`;
//     }

//     get headersHTML() {
//         return headers.map(h => `<th data-h="${h}">${h}</th>`).join('');
//     }

//     get unrankedHTML() {
//         return `<tr class="ug16-table__unranked-msg">
//                     <td colspan="${headers.length}">Other universities where this subject is taught</td>
//                 </tr>`;
//     }

//     coursesHTML(courses) {
//         return `<tr class="ug16-table__course-list">
//                     <td colspan="${headers.length}">
//                         <ul>${courses.map(c => `<li><a href="${c[0]}" target="_blank">${c[1]}</a></li>`).join('')}</ul>
//                     </td>
//                 </tr>`;
//     }

//     renderData(id, data) {
//         this.el.setAttribute('data-id', id);

//         var rows = preprocessData(data.institutions).map((row, pos) => {
//             return `<tr data-institution="${row[0]}">` + row.slice(1).map((cell, i) => {
//                 return `<td data-h="${headers[i]}">${cell || '-'}</td>`;
//             }).join('') + '</tr>';
//         });

//         var firstUnranked = data.institutions.findIndex(row => row[1] == '');
//         if (firstUnranked !== -1) {
//             rows.splice(firstUnranked, 0, this.unrankedHTML);
//         }

//         this.$tbodyEl.html(rows.join(''));

//         this.el.querySelector('.ug16-table__subject-link').innerHTML =
//             `<a href="${data.link}">Find out more about studying ${(subjectNames[id] || '').toLowerCase()}</a>`;
//     }

//     show(id) {
//         id = subjectNames[id] ? id : 'all';

//         if (subjectCache[id]) {
//             this.renderData(id, subjectCache[id]);
//         } else {
//             this.$tbodyEl.addClass('is-loading');

//             reqwest({
//                 url: config.assetPath + '/assets/subjects/' + id + '.json',
//                 type: 'json',
//                 success: data => {
//                     subjectCache[id] = data;
//                     this.$tbodyEl.removeClass('is-loading');
//                     this.show(id);
//                 }
//             });
//         }

//         this.clearSelection();
//         this.subjectChange(id);
//     }

//     expandSelection(evt) {
//         var subjectId = this.el.getAttribute('data-id');

//         if (evt.target.tagName !== 'A' && subjectId !== 'all') {
//             let row = evt.currentTarget;
//             let institutionId = row.getAttribute('data-institution');

//             this.clearSelection();

//             if (row === this.lastRow || row.className == 'ug16-table__course-list') {
//                 this.lastRow = undefined;
//             } else {
//                 this.lastRow = row;
//                 bonzo(this.el).addClass('has-selected');
//                 bonzo(row).addClass('is-selected');

//                 let courses = subjectCache[subjectId].courses[institutionId];
//                 bonzo(row).after(this.coursesHTML(courses));
//             }
//         }
//     }

//     clearSelection() {
//         bonzo(this.el).removeClass('has-selected');
//         bonzo(this.lastRow).removeClass('is-selected');
//         bonzo(this.el.querySelector('.ug16-table__course-list')).remove();
//     }

//     set(id) {
//         this.subjectsComponent.choose(id);
//     }
// }
