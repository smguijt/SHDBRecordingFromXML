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
        //console.log(data);

        //Remove SOAP Envelope Header 
        var tmpData = data;
        tmpData = tmpData.replace('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions"><soapenv:Header /><soapenv:Body>','');
        tmpData = tmpData.replace('</soapenv:Body></soapenv:Envelope>','');
        //console.log("" + tmpData);

        //Remove namespace and ns0
        var tmpData2 = tmpData;
        tmpData2 = tmpData2.replace('xmlns:ns0="urn:sap-com:document:sap:rfc:functions"','');
        tmpData2 = tmpData2.replace('ns0:','').replace('/ns0:','/');
        tmpData2 = tmpData2.replace('urn:','').replace('/urn:','/');
        //console.log("" + tmpData2);

        parser.parseString (tmpData2,  function(err, result) {
            if (err) console.log(err);
                var tmp = JSON.stringify(result);
                //console.log("" + tmp);
                //const separator = '         ';
                const separator = '\t';
                const data = JSON.parse(JSON.stringify(result));
                const mode = (data['RFC_CALL_TRANSACTION_USING']['MODE']);
                const tcode = (data['RFC_CALL_TRANSACTION_USING']['TCODE']);
                const transaction_data = (data['RFC_CALL_TRANSACTION_USING']['BT_DATA']);
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