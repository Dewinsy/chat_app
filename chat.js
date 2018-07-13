var IP = "173.255.219.164";//"192.168.137.133";

var ALL_USERS_URL = "http://"+IP+":4546/users";  /*this adds the function frm the server script that has that url*/
var LOGIN_URL = "http://"+IP+":4546/login";
var POST_MESSAGE_URL = "http://"+IP+":4546/post_message";
var READ_INBOX_URL = "http://"+IP+":4546/read_inbox";

var ID;
var CURRENT_MESSAGE;

function send_request(mthd,url,handler,payload={}){
    // payload SHOULD be  json object!
    var request = new XMLHttpRequest();           //creates a request object
    request.open(mthd, url, true);     /*request.open("MTHD", "URL", ASYNC_BOOL);*/
    request.onload = handler;

    var form =  new FormData();
    form.append("json-payload", JSON.stringify(payload));
    
    request.tag ="mush is ..."
    request.send(form);
}

function select_user()
{
    var target = this.getAttribute("cb");
    var custom_checkbox = document.getElementById(target);
    custom_checkbox.innerHTML = custom_checkbox.innerHTML=="." ? "+": ".";
}

function fetched_users()
{
    if(this.status==200)
    {
        var data =JSON.parse(this.responseText);
        
        /*
            <div class ="user">
                <div class="custom_checkbox" id="cb1">.</div>
                <div class="username" cb="cb1" onclick="select_user(this)">mush</div>
            </div>
        */
        
        var mom = document.getElementById("user_list");
        var entry_div, cb_div, uname_div;
        
        for(var i=0; i<data.length; ++i)
        {
            entry_div = document.createElement("div");
                entry_div.setAttribute("class","user");
                
            cb_div = document.createElement("div");
                cb_div.setAttribute("class","custom_checkbox");
                cb_div.setAttribute("id",data[i][0]);
                cb_div.innerHTML = ".";
                
            uname_div = document.createElement("div");
                 uname_div.setAttribute("class","username");
                 uname_div.setAttribute("cb",data[i][0]);
                 uname_div.onclick = select_user;
                 uname_div.innerHTML = data[i][1];
            
            entry_div.appendChild(cb_div);
            entry_div.appendChild(uname_div);
            
            mom.appendChild(entry_div);
        }
        
    }
    else
    {
        display_info("server reply code: "+this.status);
        return;
    }
}

function fetch_users(){
    send_request("get", ALL_USERS_URL, fetched_users);   /*creates a request object*/
}

function display_info(alert_msg){
    document.getElementById("info_text").innerHTML = alert_msg;
    document.getElementById("info").style.display="block";
}

function dismiss_info(){
    document.getElementById("info").style.display="none";
}

function cancel_users(){
    document.getElementById("user_list_div").style.display="none";
}

function display_users()
{
    var msg = document.getElementById("entry").value;
    
    if(!msg.length)
    {
        display_info("Please type something");
        return;
    }

    document.getElementById("user_list_div").style.display="block";

}

function addZero(time) {
    if (time < 10) {
        time = "0" + time;
    }
    return time;
}

function message_sent(){
     if(this.status==200)
    {
        var reply =JSON.parse(this.responseText);
        
        if(!reply["status"])
        {
            display_info(reply["log"]);
            return;
        }

        var chat_div = document.createElement("div");
                chat_div.setAttribute("class","message outgoing");
        var date = new Date();
                 
        var time_div= document.createElement("div");
             time_div.setAttribute("class","time");
             time_div.innerHTML = addZero(date.getHours()) + ":" + addZero(date.getMinutes());
             
        var sender_div = document.createElement("div");
            sender_div.setAttribute("class","sender");
            sender_div.innerHTML = "me";
            
        var msg_div = document.createElement("div");
             msg_div.setAttribute("class","msg_text");
             msg_div.innerHTML = CURRENT_MESSAGE;
        
        chat_div.appendChild(sender_div);
        chat_div.appendChild(msg_div);
        chat_div.appendChild(time_div);
        
        var mom = document.getElementById("messages_div");
        mom.appendChild(chat_div);
        mom.scrollTop = mom.scrollHeight;

        
    }
    else
    {
        display_info("relpy code: "+this.status);
        return;
    }
}

function send_message(){
    var users = document.getElementsByClassName("custom_checkbox");
    var selected = [];
    for (var i=0; i<users.length; i++)
    {
        if (users[i].innerHTML=='+')
            selected.push(users[i].getAttribute('id'));
    }
    
    if(!selected.length)
    {
        display_info("Please select a receiver!"); 
        return;
    }
    
    var msg = document.getElementById("entry").value;
    CURRENT_MESSAGE=msg;
    
    send_request("post", POST_MESSAGE_URL, message_sent, {"id":ID,"msg":msg,"recepients":selected});
    
    document.getElementById("user_list_div").style.display="none";
    document.getElementById("entry").value=""; 
}

function hide_login(){
    document.getElementById("login_div").style.display="none";
}

function logged_in(){
    if(this.status==200)
    {
        var reply =JSON.parse(this.responseText);
        
        if(!reply["status"])
        {
            display_info("Wrong username!");
            return;
        }
        ID = reply["id"];
        hide_login();
        
        setInterval(get_inbox,1000);
    }
    
    else
    {
        display_info("relpy code: "+this.status);
        return;
    }
    
}

function login(){
    var uname = document.getElementById("username_entry").value;
    if(!uname.length)
    {
        display_info("Please type your username");
        return;
    }
    send_request("post",LOGIN_URL, logged_in, {"uname":uname});
}

function get_inbox(){
    send_request("post",READ_INBOX_URL,inbox_got,{"id":ID});
}

function inbox_got(){
   if(this.status==200)
    {
        var reply =JSON.parse(this.responseText);
        
        if(!reply["status"])
        {
            display_info(reply["log"]);
            return;
        }
        
        populate_msgs(reply["messages"]);
    }
    else
    {
        display_info("relpy code: "+this.status);
        return;
    }  
}

function populate_msgs(messages){
    
    /*
        <div class="message incoming">
            <div class="sender"> ewin </div>
            <div class="msg_text"> hello<br>bwahahahahaa </div>
            <div class="time"> 5:00pm </div>
        </div>
    */
    var chat_div,sender_div,msg_div,time_div;
    
    var mom = document.getElementById("messages_div");
    
    for (var index=0; index<messages.length;index++)
    {
        chat_div = document.createElement("div");
                chat_div.setAttribute("class","message incoming");
                 
        time_div= document.createElement("div");
             time_div.setAttribute("class","time");
             time_div.innerHTML = messages[index][0];
             
        sender_div = document.createElement("div");
            sender_div.setAttribute("class","sender");
            sender_div.innerHTML = messages[index][1];
            
        msg_div = document.createElement("div");
             msg_div.setAttribute("class","msg_text");
             msg_div.innerHTML = messages[index][2];
        
        chat_div.appendChild(sender_div);
        chat_div.appendChild(msg_div);
        chat_div.appendChild(time_div);
        
        mom.appendChild(chat_div);
    }
    
    if(messages.length)
        mom.scrollTop = mom.scrollHeight;
}

window.onload = function(){ //no need for a function name since this function wont be called anywhr.
   /* console.log("Page Loaded!");
    
    var incomings = document.getElementsByClassName("incoming");   //returns a list of elements in the class named incoming in the html
    console.log(incomings);
    
    var divs = document.getElementsByTagName("div");               //returns a list of elements with a div tag name in the html
    console.log(divs);
    
    var el = document.getElementById("chat");                      //returns one element with name as chat in the html
    console.log(el);
    
    var el = document.getElementById("chat");                      //returns the real content of one element with name as chat in the html
    console.log(el.innerHTML);
    
    console.log(incomings[0].innerHTML);
    el.innerHTML = "hello";                                        //replaces or writes hello in place of MY CHAT

    var div = document.createElement("div");
    div.innerHTML = "DYNAMICALLY CREATED CONTENT";
    div.setAttribute("class","message");
    
    var mum =  document.getElementById("mum");                     //this gives the properties of the message class to the created element
    mum.appendChild(div);
    
    */
    
    fetch_users();
    //populate_msgs([["10:55am","mush","hello..."], ["10:00pm","arthur","no way!!!"], ["5:12pm","Inno","We're on today for concert, ryt?"]]);    
    
    document.getElementById("username_entry").addEventListener("keyup",function(e){
        if(e.key=="Enter")
            login();
    });
    
    document.getElementById("entry").addEventListener("keyup",function(e){
        if(e.key=="Enter")
            display_users();
    });
    
};
