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

      const staffRe = /【出演・スタッフ】/g;

      let staff = [];
      let isStaffMode = false;
      if(description){
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
      }

      story.staff = staff;

      stories.push(story);
    })
  })
  .then(() => console.log(JSON.stringify(stories)))

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

    const xRE = /@[a-zA-Z]/
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