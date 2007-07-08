/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is FireGPG.
 *
 * The Initial Developer of the Original Code is
 * FireGPG Team.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Class to access to GPG on GNU/Linux.
 */
var GPGWin = {
	//var: parent,

	/*
	 * Function to sign a text.
	 */
	sign: function(text, password, keyID) {
		var tmpInput = getTmpFile();  // Data unsigned
		var tmpOutput = getTmpFile(); // Data signed
		var tmpPASS = getTmpPassFile(); // TEMPORY PASSWORD
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		putIntoFile(tmpInput,text); // Temp

		// The file already exist, but GPG don't work if he exist, so we del it.
		removeFile(tmpOutput);

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")
		var reg = new RegExp("\n", "gi");
		running = running.replace(reg, "\r\n");

		putIntoFile(tmpRun,running);

		///////////////////////////////////////////////////
		//DON'T MOVE OR ADD ANY LINES NEXT THIS MESSAGE !//
		///////////////////////////////////////////////////

		putIntoFile(tmpPASS, password); // DON'T MOVE THIS LINE !
		try { // DON'T MOVE THIS LINE !
			runWinCommand(tmpRun, // DON'T MOVE THIS LINE !
			           '"' + this.getGPGCommand() + '" "' + tmpStdOut + '"' +
			           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor --batch" + getGPGAgentArgument() +
			           " --default-key " + keyID +
			           " --output " + tmpOutput +
			           " --passphrase-fd 0 " +
			           getGPGCommentArgument() +
			           " --clearsign " + tmpInput +
			           " < " + tmpPASS);
		}
		catch (e) {} //If execution fail, script is stopped and don't erase the password, so we add a catch
		removeFile(tmpPASS);  // DON'T MOVE THIS LINE !
		// You can move next lines

		// We get the result
		var result = getFromFile(tmpStdOut);

		// The signed text
		var crypttext = getFromFile(tmpOutput);

		var result2 = GPGReturn;
		result2.output = crypttext;
		result2.sdOut = result;

		// We delete tempory files
		removeFile(tmpInput);
		removeFile(tmpStdOut);
		removeFile(tmpOutput);
		removeFile(tmpRun);

		return result2;
	},

	// Verify a sign
	verify: function(text) {
		var tmpInput = getTmpFile();  // Signed data
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		putIntoFile(tmpInput,text); // TMP

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")
		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		          '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet --no-tty" +  getGPGTrustArgument() + " --no-verbose --status-fd 1 --armor" + getGPGAgentArgument() +
		           " --verify " + tmpInput);

		// We get the result
		var result = getFromFile(tmpStdOut);

		// We delete tempory files
		removeFile(tmpInput);
		removeFile(tmpStdOut);
		removeFile(tmpRun);

		// We return result
		return result;
	},

	// List differents keys
	listkey: function(onlyPrivate) {
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		var mode = "--list-keys";

		if (onlyPrivate == true)
			mode = "--list-secret-keys";

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")
		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor --with-colons" + getGPGAgentArgument() + " " + mode);

		// We get the result
		var result = getFromFile(tmpStdOut);

		// We delete tempory files
		removeFile(tmpStdOut);
		removeFile(tmpRun);

		// We return result
		return result;
	},

	/*
	 * Function to crypt a text.
	 */
	crypt: function(text, keyIdList, fromGpgAuth /*Optional*/) {
		var tmpInput = getTmpFile();  // Data unsigned
		var tmpOutput = getTmpFile(); // Data signed
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		if (fromGpgAuth == null)
			fromGpgAuth = false;

		putIntoFile(tmpInput,text); // Temp

		// The file already exist, but GPG don't work if he exist, so we del it.
		removeFile(tmpOutput);

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")
		var reg = new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		var keyIdListArgument = '';
		for(var i = 0; i < keyIdList.length; i++)
			keyIdListArgument += ((i > 0) ? ' ' : '') + '-r ' + keyIdList[i];

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet" +  getGPGTrustArgument(fromGpgAuth) + " --no-tty --no-verbose --status-fd 1 --armor --batch" +
		           " " + keyIdListArgument +
				   getGPGCommentArgument() + getGPGAgentArgument() +
		           " --output " + tmpOutput +
		           " --encrypt " + tmpInput);

		// We get the result
		var result = getFromFile(tmpStdOut);

		// The crypted text
		var crypttext = getFromFile(tmpOutput);
		var result2 = GPGReturn;
		result2.output = crypttext;
		result2.sdOut = result;

		// We delete tempory files
		removeFile(tmpInput);
		removeFile(tmpStdOut);
		removeFile(tmpOutput);
		removeFile(tmpRun);

		return result2;
	},

	/*
	 * Function to decrypt a text.
	 */
	decrypt: function(text, password) {
		var tmpInput = getTmpFile();  // Data unsigned
		var tmpOutput = getTmpFile(); // Data signed
		var tmpPASS = getTmpPassFile(); // tmpPASSWORD
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		putIntoFile(tmpInput,text); // Temp

		// The file already exist, but GPG don't work if he exist, so we del it.
		removeFile(tmpOutput);

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat");
		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		///////////////////////////////////////////////////
		//DON'T MOVE OR ADD ANY LINES NEXT THIS MESSAGE !//
		///////////////////////////////////////////////////

		putIntoFile(tmpPASS,password);   // DON'T MOVE THIS LINE !
		try {  // DON'T MOVE THIS LINE !
			runWinCommand(tmpRun,
			           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
			           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor --batch" + getGPGAgentArgument() +
			           " --passphrase-fd 0 " +
			           " --output " + tmpOutput +
			           " --decrypt " + tmpInput +
			           " < " + tmpPASS);
		}
		catch (e) {} //If execution fail, script is stopped and don't erase the password, so we add a catch

		removeFile(tmpPASS);  // DON'T MOVE THIS LINE !

		//You can move next lines

		// We get the result
		var result = getFromFile(tmpStdOut);

		// The decrypted text
		var crypttext = getFromFile(tmpOutput);
		var result2 = GPGReturn;
		result2.output = crypttext;
		result2.sdOut = result;

		// We delete tempory files
		removeFile(tmpInput);
		removeFile(tmpStdOut);
		removeFile(tmpOutput);
		removeFile(tmpRun);

		return result2;
	},

	/* This if we can work with GPG */
	selfTest: function() {

		//One test is ok, if the command dosen't change, it's should works..
		if (this.allreadysucceswiththeselftest == this.getGPGCommand())
			return true;

		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")
		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor" + getGPGAgentArgument() +
		           " --version");

		// We get the result
		var result = getFromFile(tmpStdOut);

		// We delete tempory files
		removeFile(tmpStdOut);
		removeFile(tmpRun);

		// If the work Foundation is present, we can think that gpg is present ("... Copyright (C) 2006 Free Software Foundation, Inc. ...")
		if (result.indexOf("Foundation") == -1)
			return false;

		//Caching due to DOS windows.
		this.allreadysucceswiththeselftest = this.getGPGCommand();

		return true;
	},

	// Import a key
	kimport: function(text) {
		var tmpInput = getTmpFile();  // Key
		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		putIntoFile(tmpInput,text); // TMP

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")

		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor" + getGPGAgentArgument() +
		           " --import " + tmpInput);

		// We get the result
		var result = getFromFile(tmpStdOut);

		// We delete tempory files
		removeFile(tmpInput);
		removeFile(tmpStdOut);
		removeFile(tmpRun);


		// We return result
		return result;
	},
	// Export a key
	kexport: function(key) {

		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")

		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " --quiet --no-tty --no-verbose --status-fd 1 --armor" + getGPGAgentArgument() +
		           " --export " + key);
		// We get the result
		var result = getFromFile(tmpStdOut);

		// We delete tempory files
		removeFile(tmpStdOut);
		removeFile(tmpRun);

		// We return result
		return result;
	},

	//Do a test of a commande
	runATest: function(option) {

		var tmpStdOut = getTmpFile(); // Output from gpg
		var tmpRun = getTmpFileRunning();

		// We lanch gpg
		var running = getContent("chrome://firegpg/content/run.bat")

		var reg=new RegExp("\n", "gi");
		running = running.replace(reg,"\r\n");

		putIntoFile(tmpRun,running);

		runWinCommand(tmpRun,
		           '"' + this.getGPGCommand() + '"' + " \"" + tmpStdOut + "\"" +
		           getGPGBonusCommand() + " " + option +
		           " --version");
		// We get the result
		var result = getFromFile(tmpStdOut);



		// We delete tempory files
		removeFile(tmpStdOut);
		removeFile(tmpRun);


		if(result.indexOf("Foundation") == "-1")
			return false;

		return true;
	},

	//Return the GPG's command to use
	getGPGCommand: function () {
		return this.GpgCommand;


	},
	//Do some tests for find the right command...
	tryToFoundTheRightCommand: function () {
		//Two choises : 1) The user want to set the path himself, so we use this.
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
		                       getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.firegpg.");

		try {
			var force = prefs.getBoolPref("specify_gpg_path");
		}
		catch (e) {
			var force = false;
		}

		if (force == true)
			this.GpgCommand = prefs.getCharPref("gpg_path");
		else {

			//Or we will try to found a valid path.

			//1) If there are allready a path set, he can be valid.
			var gpg_path_in_options = prefs.getCharPref("gpg_path","");

			if (gpg_path_in_options != "") {
				this.GpgCommand = gpg_path_in_options;
				if (this.selfTest() == true)
					return; //It's work, yourou.
			}

			//2) We have to guess some path to see if it's work...

			//TODO : Yes, it's horrible this copy/paste code...


			//GNU ?
			var testingcommand = "C:\\Program Files\\GNU\\GnuPG\\gpg.exe";
			this.GpgCommand = testingcommand;
			if (this.selfTest() == true)
			{
				//Don't forget to save the information for the nextime !
				prefs.setCharPref("gpg_path",testingcommand);
				return; //It's work, We're the best.
			}

			//Windows Privacy Tools ?
			var testingcommand = "C:\\Program Files\\Windows Privacy Tools\\GnuPG\\gpg.exe";
			this.GpgCommand = testingcommand;
			if (this.selfTest() == true)
			{
				prefs.setCharPref("gpg_path",testingcommand);
				//Don't forget to save the information for the nextime !
				return; //It's work, mwahaha.
			}

			//Maybe in the path ?
			var testingcommand = "gpg.exe";
			this.GpgCommand = testingcommand;
			if (this.selfTest() == true)
			{
				//Don't forget to save the information for the nextime !
				prefs.setCharPref("gpg_path",testingcommand);
				return; //It's work, hehehe.
			}

		}
	}
};

// vim:ai:noet:sw=4:ts=4:sts=4:tw=0:fenc=utf-8:foldmethod=indent:
