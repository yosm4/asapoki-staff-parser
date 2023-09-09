const RssParser = require('rss-parser');

const rssParser = new RssParser();

const NEWS = 'https://www.omnycontent.com/d/playlist/1e3bd144-9b57-451a-93cf-ac0e00e74446/50382bb4-3af3-4250-8ddc-ac0f0033ceb5/684015f9-2396-4ac4-bc1f-ac0f0033d08c/podcast.rss';
const MEDIATALK = 'https://www.omnycontent.com/d/playlist/1e3bd144-9b57-451a-93cf-ac0e00e74446/50382bb4-3af3-4250-8ddc-ac0f0033ceb5/07a1de49-67cf-4714-8581-ac1000059302/podcast.rss';
const SDGS = 'https://www.omnycontent.com/d/playlist/1e3bd144-9b57-451a-93cf-ac0e00e74446/50382bb4-3af3-4250-8ddc-ac0f0033ceb5/07a1de49-67cf-4714-8581-ac1000059302/podcast.rss';

let url = '';
if(process.argv.length < 3){
  url = NEWS;
} else {
  url = process.argv[2];
}


let stories = [];
rssParser.parseURL(url)
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
  .then(() => console.info(JSON.stringify(stories)))

function getStaff(line){
  const McEditRE = /MC・音源編集/;
  const EditRE = /音源編集/;
  const MCRE= /MC/;

  if(McEditRE.test(line)){
    let name = line.replace('MC・音源編集', "").replace('（）', "").replace('()', "").trim();
    return {Name: name, role: 'MC・音源編集'};
  }
  if(EditRE.test(line)){
    let name = line.replace('音源編集', "").replace('（）', "").replace('()', "").trim();
    return {Name: name, role: '音源編集'};
  }
  if(MCRE.test(line)){
    let name = line.replace('MC', "").replace('（）', "").replace('()', "").trim();
    return {Name: name, role: 'MC'};
  }

  return  {Name: line, role: '出演者'};

}