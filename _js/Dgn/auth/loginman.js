/*
 * Degino Ver.1
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

// ************************
// ログインウィンドウ管理
// ************************
Dgn.loginman = {
	init: function() {
		var that = this;

		var hdls = {
			login:	function(btn, evt) {
				that.login();
			},
			cancel:	function(btn, evt) {
				that.win.hide();
			}
		};
		
		this.form = new Ext.form.FormPanel({
			frame:		true,
			defaults:	{
				xtype:		'textfield',
				allowBlank:	false
			},
			items:		[
				{name:'mail',		fieldLabel:'メールアドレス',	validator:Dgn.util.vld_mail},
				{name:'password',	fieldLabel:'パスワード',		inputType:'password'},
				{					xtype:'panel',		html:'<br>'},
				{id:'msg1',			xtype:'panel',		html:'メールアドレス、またはパスワードが違います。', hidden:true, style:'color:red;'}
			]
		});
	
	  	this.win = new Ext.Window({
	        title:			'ログイン',
	        layout:			'fit',
	        width:			300,
	        height:			200,
	        closeAction:	'hide',
	        plain:			false,
	        items:			this.form,
			buttons:	[
				{text:'ログイン',		handler:hdls.login,	type:'submit'},
				{text:'キャンセル',	handler:hdls.cancel}
			]
	    });
	},
	login: function() {
		var that = this;

		getCmp('msg1').hide();
	
		var vals	= this.form.getForm().getValues();
		var	sha1	= CybozuLabs.SHA1.calc(vals.mail + vals.password);
		var today	= new Date();
		var word	= '' + today.getUTCFullYear() + (today.getUTCMonth()+1) + today.getUTCDate();
		var sign	= CybozuLabs.SHA1.calc(word + sha1);
		var params	= {_MSG:'_LOGIN', mail:vals.mail, sign:sign};
	
		var success = function(res, opt) {
	 		var ret	= Ext.util.JSON.decode(res.responseText);
			ret.success ? that.win.hide() : getCmp('msg1').show();
	 		Dgn.authmenu.btn_status(ret.success);
		};
	
		Ext.Ajax.request({
			method:		'POST',
			url:		'/Auth',
			params:		params,
			success:	success,
			failure:	failure_dialogue
		});
	}
};
