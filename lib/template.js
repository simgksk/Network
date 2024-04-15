//객체로 템플릿 정리
//html, list = 프로퍼티
var templateObject={
    html:function(title, list, data, control){
        return `
                    <!DOCTYPE html>
                    <html lang="kr">
                    <head>
                        <meta charset="UTF-8">
                        <title>Web-204 ${title}</title>
                    </head>
                    <body>
                    <!-- 주석, 제목 눌렀을 때 메인 페이지로 -->
                        <h1><a href="/">${title}</a></h1> 
                        <h2>${title} 시간표</h2>
                        ${list}
                        <a href="/create">글 쓰기</a>
                        ${control}
                        <p> 
                            ${data}
                        </p>
                    
                    </body>
                    </html>
        `;
    },
    list: function(filelist){
        //list 변수 생성
        var list = '<ol>'; // <ol> 태그로 시작
        var i = 0;
    
        while(i<filelist.length)
        {
            list += `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
            i += 1;
        };
        list += '</ol>';
    
        return list;
    }
} 

//모듈 내보내기
module.exports = templateObject;