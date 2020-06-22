const fs = require('fs');
const xml2js = require("xml2js");
const parser = new xml2js.Parser({explicitArray : false});
const packageSettings = require(__dirname + '/package.json');

var pad = function (pad, str, padLeft) {
    if (typeof str === 'undefined') 
      return pad;
    if (padLeft) {
      return (pad + str).slice(-pad.length);
    } else {
      return (str + pad).substring(0, pad.length);
    }
}

const padding256 = Array(256).join(' '); // make a string of 255 spaces
const padding50 = Array(51).join(' '); // make a string of 50 spaces
const padding20 = Array(21).join(' '); // make a string of 20 spaces
const padding10 = Array(11).join(' '); // make a string of 10 spaces
const padding4 = Array(5).join(' '); // make a string of 4 spaces
let validToProceed = false;

//Get arguments from command line
//example: node SHDBConvert -file:'data/ReleasePaymentBlock_61  _0200000000.xml' -showdescription
var argv = process.argv.slice(2);
if (argv.length > 0) validToProceed = true;

//Check description flag. Default is hidden (true)
let hideDescription = true;
if (argv.length > 1) {
    if (argv[1] === '-showdescription') {hideDescription = false;}
    if (argv[1] === '-showdescription:true') {hideDescription = false;}
    if (argv[1] === '-showdescription:True') {hideDescription = false;}
}

//Check Filename
let filename = ''
//filename = 'data/request.xml' //debug purpose
//validToProceed = true; //debug purpose

if (validToProceed) {
    if (argv[0] != '') {
        if (argv[0].indexOf('file:')) {
            filename = argv[0].replace("-file:","");
        }
    }
}

if (filename != '') {

    fs.readFile( __dirname + '/' + filename, "utf-8", function(err, data) {
        if (err) console.log(err);
        var tmpData = data;
        var tmpData2 = tmpData;

        let parseEnvelope = '';
        if (tmpData2.indexOf('SOAP:Envelope') != -1) { parseEnvelope = 'SOAP:Envelope'; }
        if (tmpData2.indexOf('soapenv:Envelope') != -1) { parseEnvelope = 'soapenv:Envelope'; }

        let parseBody = '';
        if (tmpData2.indexOf('SOAP:Body') != -1) { parseBody = 'SOAP:Body'; }
        if (tmpData2.indexOf('soapenv:Body') != -1) { parseBody = 'soapenv:Body'; }

        let parseMode = false;
        let parseTCode = false;
        let parseTransaction = '';
        if (tmpData2.indexOf('rfc:RFC_CALL_TRANSACTION_USING.Response') != -1) { 
            parseTransaction = 'rfc:RFC_CALL_TRANSACTION_USING.Response'; 
            parseMode = false;
            parseTCode = false;
        }
        if (tmpData2.indexOf('urn:RFC_CALL_TRANSACTION_USING') != -1) { 
            parseTransaction = 'urn:RFC_CALL_TRANSACTION_USING'; 
            parseMode = true;
            parseTCode = true;
        }

        

        parser.parseString (tmpData2,  function(err, result) {
            if (err) console.log(err);
                var tmp = JSON.stringify(result);
                const separator = '\t';
                const data = JSON.parse(JSON.stringify(result));

                const soapEnvelope = data[parseEnvelope];    
                const soapBody = soapEnvelope[parseBody];
                const rfcTransaction = soapBody[parseTransaction];

                let mode = '';
                if (parseMode) { mode = rfcTransaction['MODE']}

                let tcode = ''; 
                if (parseTransaction) { tcode = rfcTransaction['TCODE']}

                const transaction_data = rfcTransaction['BT_DATA'];

                let program = pad(padding10,"",false);
                let dynpro = pad(padding4,"0000",false);
                let dynbegin = mode;
                let fnam = pad(padding20,tcode,false);
                let fval = pad(padding50,"",false);
                let description = pad(padding50,"",false);
                    description = ";" + description;
                    if (hideDescription) description = "";

                console.log(program + separator + dynpro + separator + dynbegin + separator + fnam + separator + fval + separator + '' + description);
                transaction_data['item'].forEach(item => {
                    //console.log(JSON.stringify(item));
                    program = item['PROGRAM'] == "" ? pad(padding10,"",false) : pad(padding10,item['PROGRAM'],false);
                    dynpro = item['DYNPRO'] == "" ? pad(padding4,"0000",false) : pad(padding4,item['DYNPRO'],false);
                    dynbegin = item['DYNBEGIN'] == "" ? " " : item['DYNBEGIN'];
                    fnam = item['FNAM'] == "" ? pad(padding20,"",false) : pad(padding20,item['FNAM'],false);
                    fval = item['FVAL'] == "" ? pad(padding50,"",false) : pad(padding50,item['FVAL'],false);
                    description = item['DESCRIPTION'] == "" ? pad(padding50,"",false) : pad(padding50,item['DESCRIPTION'],false);
                    description = ";" + description;
                    if (hideDescription) description = "";

                    //if (item['PROGRAM'] !== "") console.log('');
                    console.log(program + separator + dynpro + separator + dynbegin + separator + fnam + separator + fval + separator + '' + description);
                });
        });
    });

} else {
    console.log('Usage: node ' + packageSettings.main.replace('.js','') + ' -file:<path and filename> [-showdescription:true] [> recording.txt]');
}