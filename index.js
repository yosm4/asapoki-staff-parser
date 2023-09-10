const RssParser = require('rss-parser');

const rssParser = new RssParser();

let stories = [];
rssParser.parseURL('https://www.omnycontent.com/d/playlist/1e3bd144-9b57-451a-93cf-ac0e00e74446/50382bb4-3af3-4250-8ddc-ac0f0033ceb5/684015f9-2396-4ac4-bc1f-ac0f0033d08c/podcast.rss')
  .then((feed) => {
    feed.items.forEach( item => {
      let story = {};
      story.title = item.title;
      story.pubDate = item.pubDate;
      story.link = item.link;
      story.mediaContent = item.mediaContent;

      let description = item.contentSnippet;

      const staffRe1 = /【出演・スタッフ】/;
      const staffRe2 = /【出演】/;
      const listenRe = /(.+?)に聞きました。/;

      if(description){
        if(staffRe1.test(description)){
          story.staff = extractStaffInSection(description, staffRe1);
        }
        else if(staffRe2.test(description)){
          story.staff = extractStaffInSection(description, staffRe2);
        }

        else if(listenRe.test(description)) {
          story.staff = extractStaffInText(description, listenRe);
        }
      }
      stories.push(story);
    })
  })
  .then(() => console.log(JSON.stringify(stories)))

function extractStaffInText(description, regEx) {
  const matchedText = description.match(regEx);
  const lines = matchedText[0].split(/[？、。]/);

  const sentence = lines[lines.length -2].replace('その', "");
  
  const matchingPatterns = [
    {no: 10, pattern: 'という(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 20, pattern: 'こともある(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 20, pattern: 'した(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 30, pattern: 'ある(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 40, pattern: 'きた(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 45, pattern: '呼びかけてきた(?<name>.+)さんに聞きました'},
    {no: 50, pattern: '…(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 60, pattern: '歴の長い(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 65, pattern: 'を担当する(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 68, pattern: 'を追う(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 69, pattern: '続ける(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 70, pattern: 'をする(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 70, pattern: 'を(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 80, pattern: 'する(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 90, pattern: '、(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 100, pattern: 'だった(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 110, pattern: '続ける(?<name>.+)・(?<affiliation>.+)に聞きました'},
    {no: 120, pattern: 'した(?<name>.+)・(?<affiliation>.+)に聞きました'},
    {no: 125, pattern: '務めた(?<name>.+)（(?<affiliation>.+)）に聞きました'},
    {no: 129, pattern: '(?<affiliation>.+)の(?<name>.+)と(?<affiliation2>.+)の(?<name2>.+)に聞きました'},
    {no: 130, pattern: 'の(?<name>.+)（(?<affiliation>.+)）に聞きました'},
    {no: 131, pattern: '状況を(?<name>.+)・(?<affiliation>.+)に聞きました'},
    {no: 138, pattern: 'もある(?<name>.+)に聞きました'},
    {no: 132, pattern: '(?<affiliation>.+)の(?<name>.+)に聞きました'},
    {no: 133, pattern: '(?<name>.+)・(?<affiliation>.+)に聞きました'},
    {no: 149, pattern: 'の(?<name>.+)とともに聞きました'},
    {no: 158, pattern: '！(?<name>.+)に聞きました'},
    {no: 160, pattern: '務める(?<name>.+)に聞きました'},
    {no: 165, pattern: 'している(?<name>.+)に聞きました'},
    {no: 168, pattern: 'を持つ(?<name>.+)に聞きました'},
    {no: 169, pattern: '取材を続けてきた(?<name>.+)に聞きました'},
    {no: 170, pattern: 'ついて(?<name>.+)に聞きました'},
    {no: 181, pattern: '続ける(?<name>.+)に聞きました'},
    {no: 183, pattern: '続けてきた(?<name>.+)に聞きました'},
    {no: 192, pattern: '担当する(?<name>.+)に聞きました'},
    {no: 200, pattern: 'の(?<name>.+)に聞きました'},
    {no: 210, pattern: '、(?<name>.+)に聞きました'},
    {no: 220, pattern: 'から(?<name>.+)に聞きました'},
    {no: 230, pattern: 'きた(?<name>.+)に聞きました'},
    {no: 240, pattern: '(?<name>.+)に聞きました'},
  ];

  let members = [];
  let patternRe = null;
  for(let pattern of matchingPatterns) {

    patternRe = new RegExp(pattern.pattern);

    const whoSpeaksMatch = sentence.match(patternRe);
    if(whoSpeaksMatch){
      const staff = {role: "出演者"};
      staff.Name = whoSpeaksMatch.groups.name;
      if(whoSpeaksMatch.groups.affiliation){
        staff.Affiliation = whoSpeaksMatch.groups.affiliation;
      }
      members.push(staff);
      const staff2 = {role: "出演者"};
      if(whoSpeaksMatch.groups.name2){
        staff2.Name = whoSpeaksMatch.groups.name2;

        if(whoSpeaksMatch.groups.affiliation2){
          staff2.Affiliation = whoSpeaksMatch.groups.affiliation2;
        }
        members.push(staff2);
  
      }

      return members;
    }
  }
  return null;
}

function extractStaffInSection(description, staffRe) {
  let isStaffMode = false;
  let staff = [];

  description.split(/\n/).forEach(line => {
    if(isStaffMode){
      if(line === ''
        || line === '【関連記事】'
        || line === '【ご意見・ご感想】'
        || line === '【朝ポキ情報】'
        || line === '\r' ){
        isStaffMode = false;
      } else {
        const staffSplitter = /、/;
        if(staffSplitter.test(line)){
          line.split(staffSplitter).forEach(partStaff => 
            staff.push(getStaff(partStaff))
          );
        } else {
          staff.push(getStaff(line));
        }
      }
    }
    if(staffRe.test(line)){
      isStaffMode = true;
    }
  })

  return staff;
}


function getStaff(line){
  const McEditRE = /MC・音源編集/;
  const ActEditRE = /取材・音源編集/;
  const EditRE = /音源編集/;
  const MCRE= /MC/;

  let staff = {};
  staff.role = '出演者';
  staff.Name = line;

  if(McEditRE.test(staff.Name)){
    staff.Name = staff.Name.replace('MC・音源編集', "").replace('（）', "").replace('()', "").trim();
    staff.role = 'MC・音源編集';
  }
  if(EditRE.test(staff.Name)){
    staff.Name = staff.Name.replace('取材・音源編集', "").replace('（）', "").replace('()', "").trim();
    staff.role = '取材・音源編集';
  }
  if(EditRE.test(staff.Name)){
    staff.Name = staff.Name.replace('音源編集', "").replace('（）', "").replace('()', "").trim();
    staff.role = '音源編集';
  }
  if(MCRE.test(staff.Name)){
    staff.Name = staff.Name.replace('MC', "").replace('（）', "").replace('()', "").trim();
    staff.role = 'MC';
  }
  
  const titleRE = /（(.+)）/;
  if(titleRE.test(staff.Name)){
    let affiliation = staff.Name.match(titleRE)[1];

    const xRE = /@[a-zA-Z_]/
    if(xRE.test(affiliation)){
      staff.twitter = affiliation;
    } else {
      staff.Affiliation = affiliation;
    }
    staff.Name = staff.Name.replace(affiliation, '').replace('（）', '').trim();
  }

  const urlRE = /https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/;
  if(urlRE.test(staff.Name)) {
    let url = staff.Name.match(urlRE)[0];
    staff.Name = staff.Name.replace(url, "").replace('（）', '').trim();

    if(url.startsWith('https://twitter.com')) {
      staff.twitter = url;
    } else {
      staff.profilePage = url;
    }
  }

  return  staff;

}