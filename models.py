# -*- coding: utf-8 -*-
###################################################
# Degino Ver.1
# Copyright (c) 2009 Y.Tokutomi
# Licensed under GPLv3
# http://www.gnu.org/licenses/gpl-3.0.html
#
# info@degino.com
###################################################

############
# モデル定義 #
############

import logging
import datetime
import random
import base64
from google.appengine.api import memcache
from django.utils import simplejson
from google.appengine.ext import db

# タイムゾーン
class JstTzinfo(datetime.tzinfo):
	def utcoffset(self, dt):	return datetime.timedelta(hours=9)
	def dst(self, dt):			return datetime.timedelta(0)
	def tzname(self, dt):		return 'JST'

class UtcTzinfo(datetime.tzinfo):
	def utcoffset(self, dt):	return datetime.timedelta(0)
	def dst(self, dt):			return datetime.timedelta(0)
	def tzname(self, dt):		return 'UTC'

def strdatetime(val):
	return '' if not val else val.replace(tzinfo=UtcTzinfo()).astimezone(JstTzinfo()).strftime('%Y.%m.%d %H:%M:%S')

def strToBool(val):
	return (val == 'True' or val == 'true')

# ベースモデル
class BaseModel(db.Model):
	created		= db.DateTimeProperty(	auto_now_add=True)
	updated		= db.DateTimeProperty(	auto_now=True)
	disabled	= db.BooleanProperty(	required=True,		default=False)
	owner_id	= db.IntegerProperty(	required=False,		default=0)
	owner_name	= ''

	conv_tbl	= {}		# 変換関数マップ。サブクラスで再定義して利用する。

	# id に一致する名称を補完
	def complement(self):
		if not self.owner_id:
			self.owner_name = 'System'

		else :
			acc = memcache.get('Account%s' % self.owner_id)
			if not acc:
				acc = Account.get_by_id(self.owner_id)
				ret = memcache.set('Account%s' % self.owner_id, acc, 3600*24)
	
			self.owner_name = acc.nickname or acc.mail.split('@')[0]

	# simplejson に食わせるためのデータ変換
	def record(self):
		self.complement()
		ret = {
			'_id':			self.key().id_or_name(),
			'created':		strdatetime(self.created),
			'updated':		strdatetime(self.updated),
			'disabled':		self.disabled,
			'owner_id':		self.owner_id,
			'owner_name':	self.owner_name
		}
		return ret

	# ネイティブ型変換関数
	def convNative(self, vals):
		for key in self.conv_tbl:
			if key in vals:
				if vals[key]:
					vals[key] = self.conv_tbl[key](vals[key])
				else:
					vals[key] = None

	# 文字列から日付オブジェクトを生成
	@staticmethod
	def date(val):
		y, m, d = val.split('.')
		return datetime.date(int(y), int(m), int(d)) 

# シーケンス型用インデックス管理テーブル
class Sequence(BaseModel):
	file_id		= db.IntegerProperty(	required=True,	default=0)
	element_id	= db.IntegerProperty(	required=True,	default=0)
	seq			= db.IntegerProperty(	required=True,	default=0)

	@staticmethod
	def next_val(file_id, element_id):
		query = db.GqlQuery('select * from Sequence where file_id=:1 AND element_id=:2', file_id, element_id)

		if query.count() == 0:
			rec = Sequence(file_id = file_id, element_id = element_id, seq = 0)
		else:
			rec = query.get()

		rec.seq += 1
		rec.put()
		return rec.seq

	@staticmethod
	def cur_val(file_id, element_id):
		query = db.GqlQuery('select * from Sequence where file_id=:1 AND element_id=:2', file_id, element_id)

		if query.count() == 0:
			return 0

		return query.get().seq

# テーブル
class Table(BaseModel):
	title		= db.StringProperty(	required=True,	default=u'名称未設定')
	isPublic	= db.BooleanProperty(	required=True,	default=False)
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'isPublic':	strToBool
	}

	# テーブル追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = Table(owner_id = owner_id)
		return rec.setByRequest(vals)

	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = {
			'title':	self.title,
			'isPublic':	self.isPublic,
			'remark':	self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.title		= vals.get('title',		self.title)
		self.isPublic	= vals.get('isPublic',	self.isPublic)
		self.remark		= vals.get('remark',	self.remark)
		return self

# 項目
class Element(BaseModel):
	table_id	= db.IntegerProperty(	required=True,	default=0)
	name		= db.StringProperty(	required=True,	default=u'名称未設定')
	f_type		= db.IntegerProperty(	required=True,	default=11)
	isRequired	= db.BooleanProperty(	required=False)
	option		= db.TextProperty(		required=False) 
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'table_id':		long,
		'f_type':		int,
		'isRequired':	strToBool
	}

	# 項目追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = Element(owner_id = owner_id)
		return rec.setByRequest(vals)

	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = {
			'name':			self.name,
			'remark':		self.remark,
			'f_type':		self.f_type,
			'isRequired':	self.isRequired,
 			'option':		self.option,
			'remark':		self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.name		= vals.get('name',			self.name)
		self.table_id	= vals.get('table_id',		self.table_id)
		self.f_type		= vals.get('f_type',		self.f_type)
		self.isRequired	= vals.get('isRequired',	self.isRequired)
		self.option		= vals.get('option',		self.option)
		self.remark		= vals.get('remark',		self.remark)
		return self

# ファイル
class File(BaseModel):
	table_id	= db.IntegerProperty(	required=True,	default=0)
	name		= db.StringProperty(	required=True,	default=u'名称未設定')
	isPublic	= db.BooleanProperty(	required=True,	default=False)
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'table_id':	long,
		'isPublic':	strToBool
	}

	# 項目追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = File(owner_id = owner_id)
		return rec.setByRequest(vals)


	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = {
			'table_id':	self.table_id,
			'isPublic':	self.isPublic,
			'name':		self.name,
			'remark':	self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.table_id	= vals.get('table_id',	self.table_id)
		self.isPublic	= vals.get('isPublic',	self.isPublic)
		self.name		= vals.get('name',		self.name)
		self.remark		= vals.get('remark',	self.remark)
		return self

class Appli(BaseModel):
	label		= db.StringProperty(	required=True,	default=u'名称未設定')
	isPublic	= db.BooleanProperty(	required=True,	default=False)
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'isPublic':	strToBool
	}

	# 項目追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = Appli(owner_id = owner_id)
		return rec.setByRequest(vals)


	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = {
			'label':	self.label,
			'isPublic':	self.isPublic,
			'remark':	self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.isPublic	= vals.get('isPublic',	self.isPublic)
		self.label		= vals.get('label',		self.label)
		self.remark		= vals.get('remark',	self.remark)
		return self

# チャネル
class Channel(BaseModel):
	appli_id	= db.IntegerProperty(	required=True,	default=0)
	title		= db.StringProperty(	required=True,	default=u'名称未設定')
	channeltype	= db.IntegerProperty(	required=True,	default=0)
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'appli_id':		long,
		'channeltype':	int
	}

	# 項目追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = Channel(owner_id = owner_id)
		return rec.setByRequest(vals)


	# simplejson に食わせるためのデータ変換
	def record(self):
#		logging.debug('CHANNELTYPE %s' % self.channeltype)
		ret = {
			'title':		self.title,
			'channeltype':	self.channeltype,
			'remark':		self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.appli_id		= vals.get('appli_id',		self.appli_id)
		self.title			= vals.get('title',			self.title)
		self.channeltype	= vals.get('channeltype',	self.channeltype)
		self.remark			= vals.get('remark',		self.remark)
		return self

# パネル
class Panel(BaseModel):
	title		= db.StringProperty(	required=True,	default=u'名称未設定')
	file_id		= db.IntegerProperty(	required=True,	default=0)
	channel_id	= db.IntegerProperty(	required=True,	default=0)
	paneltype	= db.IntegerProperty(	required=True,	default=0)
	edittype	= db.IntegerProperty(	required=True,	default=0)
	filtertype	= db.IntegerProperty(	required=True,	default=0)
	view_type	= db.IntegerProperty(	required=False)
	remark		= db.TextProperty(		required=False)

	conv_tbl	= {
		'file_id':		long,
		'channel_id':	long,
		'paneltype':	int,
		'edittype':		int,
		'filtertype':	int,
		'view_type':	int
	}

	view_type_conv = {		# 旧 view_type の設定をコンバート
		11:	[0, 0, 0],		# 一覧表
		12:	[0, 1, 0],		# 一覧表 (編集可能)
		13:	[0, 0, 1],		# 一覧表 (月別フィルター)
		21:	[0, 3, 0],		# フォーム
		22:	[0, 2, 0],		# フォーム (一覧表付き)
		51:	[1, 0, 0],		# チャート-折れ線
		52:	[2, 0, 0],		# チャート-棒
		53:	[3, 0, 0]		# チャート-円
	}

	# 項目追加
	@staticmethod
	def newdefault(vals, owner_id):
		rec = Panel(owner_id = owner_id)
		return rec.setByRequest(vals)

	# simplejson に食わせるためのデータ変換
	def record(self):
		# 旧 view_type の設定をコンバート
		if self.view_type:
			temp = self.view_type_conv[self.view_type]
			self.paneltype	= temp[0]
			self.edittype	= temp[1]
			self.filtertype	= temp[2]
			self.view_type	= None
			self.put()

		ret = {
			'title':		self.title,
			'file_id':		self.file_id,
			'channel_id':	self.channel_id,
#			'view_type':	self.view_type,
			'paneltype':	self.paneltype,
			'edittype':		self.edittype,
			'filtertype':	self.filtertype,
			'remark':		self.remark
		}
		ret.update(BaseModel.record(self))
		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.title		= vals.get('title',			self.title)
		self.file_id	= vals.get('file_id',		self.file_id)
		self.channel_id	= vals.get('channel_id',	self.channel_id)
# 		self.view_type	= vals.get('view_type',		self.view_type)
		self.paneltype	= vals.get('paneltype',		self.paneltype)
		self.edittype	= vals.get('edittype',		self.edittype)
		self.filtertype	= vals.get('filtertype',	self.filtertype)
		self.remark		= vals.get('remark',		self.remark)
		return self

# アカウント
class Account(BaseModel):
	nickname	= db.StringProperty(	required=False)
	basehash	= db.StringProperty(	required=True,	default='dummy')
	mail		= db.EmailProperty(		required=True,	default='dummy')
	birthday	= db.DateProperty(		required=False)
	license		= db.IntegerProperty(	required=True,	default=0)	# 0.未承認 1.一般 2.有償
	isAdmin		= db.BooleanProperty(	required=True,	default=False)
	remark		= db.TextProperty(		required=False)
	registered	= db.DateTimeProperty(	required=False)
	loginkey	= db.StringProperty(	required=False)
	lastlogined	= db.DateTimeProperty(	required=False)
	authkey		= db.StringProperty(	required=False)

	conv_tbl	= {
		'isAdmin':	strToBool,
		'birthday':	BaseModel.date
	}

	# アカウント追加
	@staticmethod
	def newdefault(vals, owner_id):
		# 乱数 (認証キーの種) 作成
		temp			= str(random.random())

		# レコード作成
		rec = Account(
			authkey		= base64.urlsafe_b64encode(temp),
			owner_id	= owner_id
		)
		return rec.setByRequest(vals)

	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = {
			'nickname':		self.nickname,
			'basehash':		self.basehash,
			'mail':			self.mail,
			'birthday':		self.birthday.strftime('%Y.%m.%d') if self.birthday	!= None else '',
			'license':		self.license,
			'isAdmin':		self.isAdmin,
			'remark':		self.remark,
			'registered':	strdatetime(self.registered),
			'loginkey':		self.loginkey,
			'lastlogined':	strdatetime(self.lastlogined),
			'authkey':		self.authkey
		}
		ret.update(BaseModel.record(self))

		return ret

	# データ更新
	def setByRequest(self, vals):
		self.convNative(vals)

		self.nickname	= vals.get('nickname',		self.nickname)
		self.basehash	= vals.get('basehash',		self.basehash)
		self.mail		= vals.get('mail',			self.mail)
		self.birthday	= vals.get('birthday',		self.birthday)
		self.license	= vals.get('license',		self.license)
		self.isAdmin	= vals.get('isAdmin',		self.isAdmin)
		self.remark		= vals.get('remark',		self.remark)
		self.registered	= vals.get('registered',	self.registered)
		self.lastlogined= vals.get('lastlogined',	self.lastlogined)
		self.authkey	= vals.get('authkey',		self.authkey)

#		memcache.replace('Account%s' % self.key().id_or_name, self, 3600*24)

		return self

	@staticmethod
	def queryForRegist(mail):
		return db.GqlQuery('select * from Account where mail=:1', mail)

	@staticmethod
	def queryForConform(authkey):
		return db.GqlQuery('select * from Account where authkey=:1', authkey)

	@staticmethod
	def queryForLogin(mail):
		return db.GqlQuery('select * from Account where mail=:1 AND license > 0', mail)

# レコード
class Record(BaseModel):
	file_id		= db.IntegerProperty(	required=True)
	json		= db.TextProperty(		required=False)

	# simplejson に食わせるためのデータ変換
	def record(self):
		ret = simplejson.loads(self.json)

		ret.update(BaseModel.record(self))
		return ret

	# simplejson に食わせるためのデータ変換
	def rowrecord(self):
		ret = {
			'file_id':	self.file_id,
			'json':		self.json
		}
		ret.update(BaseModel.record(self))

		return ret
