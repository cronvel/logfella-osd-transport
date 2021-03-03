/*
	Logfella OSD Transport

	Copyright (c) 2015 - 2018 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const CommonTransport = require( 'logfella-common-transport' ) ;
const Promise = require( 'seventh' ) ;
const platform = require( 'os' ).platform() ;



var nodeNotifier , freedesktopNotifications ;
var exitCleanup ;



switch ( platform ) {
	case 'linux' :
		try {
			freedesktopNotifications = require( 'freedesktop-notifications' ) ;
			freedesktopNotifications.setUnflood( 300 ) ;

			exitCleanup = function() {
				freedesktopNotifications.purge() ;
			} ;

			process.on( 'asyncExit' , exitCleanup ) ;
			process.on( 'exit' , exitCleanup ) ;
		}
		catch ( error ) {
			nodeNotifier = require( 'node-notifier' ) ;
		}
		break ;
	default :
		nodeNotifier = require( 'node-notifier' ) ;
}



function OsdTransport( logger , config = {} ) {
	CommonTransport.call( this , logger , config ) ;

	this.color = false ;
	this.indent = false ;
	this.includeIdMeta = !! config.includeIdMeta ;
	this.includeCommonMeta = config.includeCommonMeta === undefined ? true : !! config.includeCommonMeta ;
	this.includeUserMeta = config.includeUserMeta === undefined ? true : !! config.includeUserMeta ;
}

module.exports = OsdTransport ;

OsdTransport.prototype = Object.create( CommonTransport.prototype ) ;
OsdTransport.prototype.constructor = OsdTransport ;



OsdTransport.prototype.transport = function( data , cache ) {
	return new Promise( resolve => {
		this.notify( {
			title: data.app + ' ' + data.levelName + ' (' + data.domain + ')' ,
			message: this.messageFormatter( data , cache ) ,
			urgency: data.level >= 5 ? 'critical' : 'normal'
		} , resolve ) ;
	} ) ;
} ;



const iconPath = __dirname + '/../icons/log.png' ;
const soundPath = __dirname + '/../sounds/spear.wav' ;

OsdTransport.prototype.transportFreedesktopNotifications = function( data , cache ) {
	return new freedesktopNotifications.Notification( {
		summary: data.app + ' ' + data.levelName + ' (' + data.domain + ')' ,
		body: this.messageFormatter( data , cache ) ,
		urgency: data.level >= 5 ? 'critical' : 'normal' ,
		icon: iconPath
		//, sound: soundPath	// Sound have bugs in some Gnome shell version
	} ).push() ;
} ;



OsdTransport.prototype.transportNodeNotifier = function( data , cache ) {
	return new Promise( resolve => {
		nodeNotifier.notify(
			{
				title: data.app + ' ' + data.levelName + ' (' + data.domain + ')' ,
				message: this.messageFormatter( data , cache ) ,
				urgency: data.level >= 5 ? 'critical' : 'normal' ,
				icon: iconPath
			} ,
			() => { resolve() ; }
		) ;
	} ) ;
} ;



OsdTransport.prototype.transport =
	freedesktopNotifications ? OsdTransport.prototype.transportFreedesktopNotifications :
	nodeNotifier ? OsdTransport.prototype.transportNodeNotifier :
	function() {} ;

