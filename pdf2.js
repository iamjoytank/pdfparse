const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('./pdf1.PDF');
 var lastinvoice = "";
var invoicearr = {};
var materialsArr = [];
pdf(dataBuffer).then(function (data) {
    // use data
    let p1 = data.text;
    let darr = p1.split("\n");
    findInVoice(darr);
    // darr.forEach(elem => {
    //     findInVoice(elem);
        
    // })
}).catch(function (error) {
        // handle exceptions
        console.log(error);
});

// seperate materials for an invoice
function seperateMaterials(invoice)
{
    // invoicearr => invoiceno => materials : []
    // count no of materials in each invoice
    var c = 0;

    // find gst cess and have count

    console.log("In voice Number: "+invoice);
    let arr = invoicearr[invoice];
    // console.log(arr);
    let dashcount = 0;
    var materials = [];
    let matIndex = 0;
    let mindex = {};
    let str = null;
    arr.forEach((elem,i) => { 
        // find gst cess
        // incr counter
        
        if (i == 0)
        {
            console.log("New Invoice data---");
            // console.log(elem);
        }
        if (elem.match(/Slno(\s)+(RITC)(\s+)/))
        {
            // console.log(elem);
        }
        if (elem.match(/.*GST Cess.*/))
        {
            c++;
            mindex[c] = i;
        }
        let s = findsurCharge(elem);
        if (s)
        {
            // console.log("S: " + s)
        }
    });
    // console.log("Materials for invoice: " + invoice + " is " + c);
    // console.log(mindex);
    let matearr = [];
    for (let j in mindex)
    {
        // console.log(mindex[j]);
        // get the index of start of material and print start of material
        // console.log(arr[mindex[j] - 10]);
        let materialObj = {};
        let str = "";
        str += arr[mindex[j] - 11].trim() + "### ";
        str += arr[mindex[j] - 10].trim();
        str += arr[mindex[j] - 9].trim();
        str += arr[mindex[j] - 8].trim();
        str += arr[mindex[j] - 7].trim() + " ###";
        matearr.push(str);

        // index of material
        if (findMaterialIndex(str)) {
            materialObj.materialNo = findMaterialIndex(str);
        }
        // HSN code
        if (findMaterialRITC(str)) {
            materialObj.HSNCode = findMaterialRITC(str);
        }
        //BCD Amt(RS)
        if (findBCD(arr[mindex[j] - 8].trim())) {
            materialObj.BCD = findBCD(arr[mindex[j] - 8].trim());
        }  
        //Ass value
        if (findAssVal(arr[mindex[j] - 7].trim())) {
            materialObj.AssVal = findAssVal(arr[mindex[j] - 7].trim());
        }
        
        // console.log("Material index: "+materialObj.materialNo+"Material HSN:"+materialObj.HSNCode);
    }
    // console.log(matearr);

}
//to find INVOICE no and INVOICE Date
function findInVoice(darr) {
    darr.forEach(elem => {
        let m = elem.match(/Inv No & Dt. : (\S+)(\s+)(\S+)(\s+)(.*)/);
    if (m) {
        lastinvoice = m[1];
        // console.log(str);
        let str1 = "Invoice no: " + m[1] + ", ";
        str1 += "Invoice Date: " + m[3] + ", ";
        str1 += "Vendor Name: " + m[5].trim();
        str1 += "\n";
    }
                
    if (lastinvoice != "") {
        fs.writeFile("temp.txt", elem, { flag: 'a+' }, (err) => {
            if (err)
                console.log(err);
        })
        if (invoicearr[lastinvoice] && invoicearr[lastinvoice].length > 0) {
            invoicearr[lastinvoice].push(elem);
        }
        else {
            invoicearr[lastinvoice] = [];
            invoicearr[lastinvoice].push(elem);
        }
    }
    
     });
    for (let k in invoicearr) {
        // console.log(k + ":" + invoicearr[k].length);
        // for each invoice
        // try to get the part name
        // let inarr = invoicearr[k];
        seperateMaterials(k);
        // inarr.forEach(x => {
        //     // console.log(x);
        //     seperateMaterials(x);
        // });
    }
}
//to find BOE no and BOE date
function findBOE() {
    // let BOM = elem.match(/BE No (\S+)(,)(\S+)(\s+)(\S+)(\s+)(\S+)(,)/);
    if (BOM) {
        // console.log(BOM);
        let str = "BOE no: " + BOM[1] + ",";
        str += "BOE date: " + BOM[7];
        console.log(str);
    }
}
//to find INVOICE Val in Currency
function findInVoiVal() {
    let invVal = elem.match(/Inv Val(\s+)(:)(\s+)(\S+)/);
    if (invVal) {
        let str = " Inv Val: " + invVal[4];
        console.log(str);
    }
}
//to find Freight in Currency
function findFreightCurr() {
    let freightCurr = elem.match(/Freight (\s+)(:)(\s+)(\S+)/);
    if (freightCurr) {
        let str = " Freight : " + freightCurr[4];
        console.log(str);
    }
}
//to find Exchange rate
function findFxRate() {
    let exchangeRate = elem.match(/Exchange rate(\S+)(\s+)(.*)(=)(\s+)(\S+)/);
    if (exchangeRate) {
        let str = " Exchange rate : " + exchangeRate[6];
        console.log(str);
    }    
}
// to find AMount in INR we need to pass FxRate * InVoiVal in currency
function findAmtINR(FxRate,inVoiVal){
    return FxRate * inVoiVal;
}
//to find Social Welfare Surcharge --- roundup
function findsurCharge(elem) {
    let surCharge = elem.match(/Social Welfare Surcharge:(\s+)(\S+)(\s+)(\S+)(\s+)(\s+)(\S+)/);
    if (surCharge) {
        let str = " Social Welfare Surcharge : " + surCharge[7];
        // console.log(str);
        return surCharge[7];
    } 
    else
    {
        return null;
    }
}
//to find IGST --- roundup
function findIGST() {
    let igst = elem.match(/IGST(\s+)(\S+)(\s+)(\S+)(\s+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)/);
    if (igst) {
        let str = " IGST : " + igst[11];
        console.log(str);
    }
}
//to find country of origin
function findCountry() {
    let cntryOrg = elem.match(/Cntry Of Orgn.:(\s+)(\S+)/);
        if (cntryOrg) {
            let str = " country of origin " + cntryOrg[2];
            console.log(cntryOrg);
        }
}
//to find air bill number
function findairBillNo() {
    let airBillNo = elem.match(/HAWB No(\s+)(\S+)(\s+)(\S+)/);
    if (airBillNo) {
        let str = " Air bill NO " + airBillNo[4];
        console.log(str);
    }    
}
//to find air bill date
function findairBillDate() {
    let airBillDt = elem.match(/Date(\s+)(\S+)(\s+)(\S+)/);
        if (airBillDt) {
            let str = " Air bill Date " + airBillDt[4];
            console.log(str);
        }
}
//to find CHA
function findCHA() {
    let CHA = elem.match(/CHA(\s+)(\S+)(\s+)(\S+)(\s+)(\[)(.*)(\])/);
    if (CHA) {
        let str = " CHA :" + CHA[7];
        console.log(str);
    }
}
// to find material index no
function findMaterialIndex(material) {
    let str = material.match(/((###)(\s+)(\d+))/);
    if (str) {
        console.log(str[4])
        return str[4];
    }
}
// to find ritc number of material i.e HSN code
function findMaterialRITC(material) {
    let str = material.match(/((###)(\s+)(\d+)(\s+)(\S+))/);
    if (str) {
        // console.log(str)
        return str[6];
    }
}
//to find BCD
function findBCD(material) {
    let str = material.match(/(\S+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)/);
    if (str) {
        // console.log(str[15])
        return str[15];
    }
}
//to find ass value
function findAssVal(material) {
    let str = material.match(/(\S+)(\s+)(\S+)/);
    if (str) {
        console.log(str)
        // return str[15];
    }
}