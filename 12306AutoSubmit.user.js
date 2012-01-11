/*
		12306 Auto Submit => A javascript snippet to help you auto submit.
		Copyright (C) 2011 Kevintop
		
		Includes jQuery
		Copyright 2011, John Resig
		Dual licensed under the MIT or GPL Version 2 licenses.
		http://jquery.org/license

		Includes 12306.user.js
		https://gist.github.com/1554666
		Copyright (C) 2011 Jingqin Lynn
		Released GNU Licenses.

		This program is free software: you can redistribute it and/or modify
		it under the terms of the GNU General Public License as published by
		the Free Software Foundation, either version 3 of the License, or
		(at your option) any later version.

		This program is distributed in the hope that it will be useful,
		but WITHOUT ANY WARRANTY; without even the implied warranty of
		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
		GNU General Public License for more details.

		You should have received a copy of the GNU General Public License
		along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// ==UserScript==  
// @name         12306 Auto Submit  
// @author       kevintop@gmail.com  
// @namespace    https://plus.google.com/107416899831145722597/none  
// @description  A javascript snippet to help you auto submit 12306.cn
// @include      *://dynamic.12306.cn/otsweb/order/confirmPassengerAction.do*
// ==/UserScript== 
function withjQuery(callback, safe){
	if(typeof(jQuery) == "undefined") {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";

		if(safe) {
			var cb = document.createElement("script");
			cb.type = "text/javascript";
			cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery);";
			script.addEventListener('load', function() {
				document.head.appendChild(cb);
			});
		}
		else {
			var dollar = undefined;
			if(typeof($) != "undefined") dollar = $;
			script.addEventListener('load', function() {
				jQuery.noConflict();
				$ = dollar;
				callback(jQuery);
			});
		}
		document.head.appendChild(script);
	} else {
		callback(jQuery);
	}
}
withjQuery(function($){
	var userInfoUrl = 'https://dynamic.12306.cn/otsweb/sysuser/user_info.jsp';
	//var userInfoUrl = 'https://dynamic.12306.cn/otsweb/order/myOrderAction.do?method=queryMyOrderNotComplete&leftmenu=Y';
	var count = 0;
	var t;
	var doing = false;
	function submitForm(){
		//更改提交列车日期参数
		var wantDate = $("#startdatepicker_edit").val();
		//alert(wantDate);
		$("#start_date").val(wantDate);
		$("#_train_date_str").val(wantDate);
		//$(".qr_box :checkbox[name^='checkbox']").each(function(){alert($(this).val())});
		jQuery.ajax({
					url: $("#confirmPassenger").attr('action'),
					data: $('#confirmPassenger').serialize(),
					beforeSend: function( xhr ) {
						xhr.setRequestHeader('X-Requested-With', {toString: function(){ return ''; }});
						xhr.setRequestHeader('Cache-Control', 'max-age=0');
						xhr.setRequestHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
					},
					type: "POST",
					timeout: 60000,
					success: function(msg)
					{
						//Refresh token
						var match = msg && msg.match(/org\.apache\.struts\.taglib\.html\.TOKEN['"]?\s*value=['"]?([^'">]+)/i);
						var newToken = match && match[1];
						if(newToken) {
							$("input[name='org.apache.struts.taglib.html.TOKEN']").val(newToken);
						}

						if( msg.indexOf('payButton') > -1 ) {
							//Success!
							alert("车票预订成功，恭喜!");
							window.location.replace(userInfoUrl);
							return;
						}
						var reTryMessage = ['用户过多','确认客票的状态后再尝试后续操作','请不要重复提交'];
							for (var i = reTryMessage.length - 1; i >= 0; i--) {
								if( msg.indexOf( reTryMessage[i] ) > -1 ) {
									showMsg(reTryMessage[i]);
									if (doing){
										reSubmitForm();
									}
									
									return;
							}
						};
						//Parse error message
						msg = msg.match(/var\s+message\s*=\s*"([^"]*)/);
						stop(msg && msg[1] || '出错了。。。。 啥错？ 我也不知道。。。。。');
					},
					error: function(msg){
						showMsg(msg);
						reSubmitForm();
					}
				});
	};
	function showMsg(msg){
		$("#msg_div").html($("#msg_div").html() + "<div>第"+count+"次："+msg+"</div>");
	}
	function reSubmitForm(){
		count++;
		$('#refreshButton').html("("+count+")次提交中...单击停止");
		//t = setTimeout(submitForm, 500);
	}
	function reloadSeat(){
		$("select[name$='_seat']").html('<option value="M">一等座</option><option value="O" selected="">二等座</option><option value="1">硬座</option><option value="3">硬卧</option><option value="4">软卧</option>');
	}
	//初始化
    if($("#refreshButton").size()<1){
			//重置后加载所有席别
			$("select[name$='_seat']") .each(function(){this.blur(function(){
				alert(this.attr("id") + "blur");
			});});
			//初始化所有席别
			//$(".qr_box :checkbox[name^='checkbox']").each(function(){$(this).click(reloadSeat)});
			//reloadSeat();
			$(".conWrap").append("<div id='msg_div'></div>");
			//日期可选
			$("td.bluetext:first").html('<input type="text" name="orderRequest.train_date_edit" value="' +$("#start_date").val()+'" id="startdatepicker_edit" style="width: 150px;" class="input_20txt"  onfocus="WdatePicker({firstDayOfWeek:1})" />');
			$(".tj_btn").append($("<a href='#' style='padding: 5px 10px; background: #2CC03E;border-color: #259A33;border-right-color: #2CC03E;border-bottom-color:#2CC03E;color: white;border-radius: 5px;text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.2);'/>").attr("id", "refreshButton").html("自动提交订单").click(function() {
				if (doing == true){
					clearInterval(t);
					t = 0;
					$(this).html("自动提交订单");
					$('#msg_div').html("");
					count = 0;
				}else {
					if(window.submit_form_check && !submit_form_check("confirmPassenger") ) { 
						return;
					}
					count = 1;
					$(this).html("(1)次提交中...单击停止");
					submitForm();
					t = setInterval(submitForm, $("#freq").val());
					//submitForm();
				}
				doing = !doing;
			    return false;
		    }));
			$(".tj_btn").append("自动提交频率：<select id='freq' ><option value='500' >0.5s</option><option value='1000' >1s</option><option value='2000' >2s</option><option value='3000' >3s</option><option value='4000' >4s</option><option value='5000' selected=''>5s</option><option value='6000' >6s</option><option value='7000' >7s</option><option value='8000' >8s</option><option value='9000' >9s</option><option value='10000' >10s</option></select>");
     }
}, true);
