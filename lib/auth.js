function authUI(req, res)
{
    let authStatus = '<a href="/auth/login">로그인</a>'
        if(req.user)
        {
            //로그인이 되어 있는 사람 --> 닉네닙 응답, 로그아웃 하이퍼링크
            authStatus=`${req.user.nickName} | <a href="/auth/logout">로그아웃</a>`
        }
        return authStatus;
}
module.exports = authUI;