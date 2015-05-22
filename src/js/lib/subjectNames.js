import names from '../data/subjectNames.json!json';

export function lowercase(subjectId) {
    var name = names[subjectId];
    if (!name) return;
    else name = name.toLowerCase();

    if (name.startsWith('american')) return 'A' + name.substr(1);
    else if (name.startsWith('english')) return 'E' + name.substr(1);
    else return name;
}
