const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('./BOBST JOB NO. 0712 BOE.PDF');
 var lastinvoice = "";
var invoicearr = {};
var materialsArr = [];
let cntryOrg = '';
let airBillNo = '';
let airBillDt = '';
let boeNo = '';
let boeDate = '';
pdf(dataBuffer).then(function (data) {
    let p1 = data.text;
    let darr = p1.split("\n");
    findInVoice(darr);
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
    var materialArr = [];
    let mindex = {};
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
        if (elem.match(/GST Cess(\s+)(\d+)(\/)(\d+)/))
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
        // str += arr[mindex[j] - 8].trim();
        // str += arr[mindex[j] - 7].trim() + " ###";
        // matearr.push(str);

        // index of material
        materialObj.materialNo = findMaterialIndex(str);
        // HSN code
        materialObj.HSNCode = findMaterialRITC(str);
        //BCD Amt(RS)
        materialObj.BCD = findBCD(arr[mindex[j] - 8].trim());
        //Ass value
        materialObj.AssVal = findAssVal(arr[mindex[j] - 7].trim());
        //Social Welfare Surcharge
        materialObj.surCharge = findsurCharge(arr[mindex[j] - 2].trim());
        //IGST
        materialObj.IGST = findIGST(arr[mindex[j] - 1].trim());
        //des
        let desObj = findDes(str);
        // console.log(desObj);
        materialObj.desOfGoods = desObj.desOfGoods;
        materialObj.partCode = desObj.partCode;
        materialObj.quantity = desObj.quantity;

        materialObj.invoice = invoice;
        let invobj = invoiceDetails.find(xx => xx.invoice === invoice);
        materialObj.invoiceDate = invobj.vendorDate;
        materialObj.vendorName = invobj.vendorName;
        materialObj.boeNo = boeNo;
        materialObj.boeDate = boeDate;
        materialObj.inVoiValue = invobj.inVoiValue;
        materialObj.exchangeRate = invobj.exchangeRate;
        materialObj.CHA = invobj.CHA;
        materialObj.amtInINR = findAmtINR(materialObj.exchangeRate, materialObj.inVoiValue);
        materialObj.cntryOrg = cntryOrg;
        materialObj.airBillNo = airBillNo;
        materialObj.airBillDt = airBillDt;
        materialArr.push(materialObj);
    }
    console.log(materialArr);
}

var invoiceDetails = [];

//to find INVOICE no and INVOICE Date
function findInVoice(darr) {
    darr.forEach(elem => {
        let m = elem.match(/Inv No & Dt. : (\S+)(\s+)(\S+)(\s+)(.*)/);
        // console.log(elemTxt);
        let cntryOrgArr = elem.match(/Cntry Of Orgn.:(\s+)(\S+)/);
        if (cntryOrgArr && cntryOrgArr.length > 0) {
            // let str = " country of origin " + cntryOrg[2];
            // console.log("cntryOrg  "+cntryOrgArr[2]);
            cntryOrg =  cntryOrgArr[2];
        }
        let airBillNoArr = elem.match(/HAWB No(\s+)(\S+)(\s+)(\S+)/);
        if (airBillNoArr && airBillNoArr.length > 0) {
            // let str = " Air bill NO " + airBillNo[4];
            // console.log("airBillNo:"+airBillNo[4]);
            airBillNo =  airBillNoArr[4];
        }
        let airBillDtArr = elem.match(/Date(\s+)(\S+)(\s+)(\S+)/);
        if (airBillDtArr && airBillDtArr.length > 0) {
            // let str = " Air bill Date " + airBillDt[4];
            // console.log("airBillDt:"+ airBillDt[4]);
            airBillDt =  airBillDtArr[4];
        }
        let boedetails = findBOE(elem);
        if (boedetails){
            boeNo = boedetails.boeNo;
            boeDate = boedetails.boeDate;
        }
        if (m) {
            // console.log("inner ------ ------ \n\n\n"+elemTxt.length);
            lastinvoice = m[1];
            let str1 = "Invoice no: " + m[1] + ", ";
            str1 += "Invoice Date: " + m[3] + ", ";
            str1 += "Vendor Name: " + m[5].trim();
            var obj = {};
            obj.invoice = m[1];
            obj.vendorDate = m[3];
            obj.vendorName = m[5];
            let x = invoiceDetails.find(m1 => m1.invoice === m[1]);
            // console.log("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg")
            // console.log(x);
            if(x == null || x == "undefined")
                invoiceDetails.push(obj);
            str1 += "\n";
        }
                    
        if (lastinvoice != "") {

            let inVoiValue = findInVoiVal(elem);
            if (inVoiValue)
            {
                let x = invoiceDetails.find((m1) => {
                    if (m1.invoice === lastinvoice)
                    {
                        m1.inVoiValue = inVoiValue;
                    }
                });                
            }
            let freightCurr = findFreightCurr(elem);
            if (freightCurr)
            {
                let x = invoiceDetails.find((m1) => {
                    if (m1.invoice === lastinvoice)
                    {
                        m1.freightCurr = freightCurr;
                    }
                });
            }
            let exchangeRate = findFxRate(elem);
            if (exchangeRate)
            {
                let x = invoiceDetails.find((m1) => {
                    if (m1.invoice === lastinvoice)
                    {
                        m1.exchangeRate = exchangeRate;
                    }
                });
            }
            let CHA = findCHA(elem);
            if (CHA)
            {
                let x = invoiceDetails.find((m1) => {
                    if (m1.invoice === lastinvoice)
                    {
                        m1.CHA = CHA;
                    }
                });
            }
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
    // console.log(invoiceDetails);
}
//to find BOE no and BOE date (\S+)(,)(\S+)(\s+)(\S+)(\s+)(\S+)(,)
function findBOE(material) {
    let boeObj = null;
    let BOM = material.match(/BE No(\/)Dt.(\/)cc(\/)Typ:(\d+)(\/)(\d{2})(\/)(\d{2})(\/)(\d{4}).*/);
    // console.log(material)
    if (BOM && BOM.length > 0) {
        boeObj = {};
        // let str = "BOE no: " + BOM[4] + ",";
        boeObj.boeNo = BOM[4];                                                            //boe number
        // str += "BOE date: " + BOM[6] + BOM[7] + BOM[8] + BOM[9] + BOM[10];
        boeObj.boeDate = BOM[6] + BOM[7] + BOM[8] + BOM[9] + BOM[10];                    // boe date
        // console.log("BOM"+BOM);               
        // console.log(boeObj);
        return boeObj;
    }
    return null;
    

}
//to find INVOICE Val in Currency
function findInVoiVal(material) {
    let invVal = material.match(/Inv Val(\s+)(:)(\s+)(\S+)/);
    if (invVal && invVal.length > 0) {
        let str = " Inv Val: " + invVal[4];
        // console.log(str);
        return invVal[4];
    }
    return null;
}
//to find Freight in Currency
function findFreightCurr(material) {
    let freightCurr = material.match(/Freight (\s+)(:)(\s+)(\S+)/);
    if (freightCurr && freightCurr.length > 0) {
        let str = " Freight : " + freightCurr[4];
        // console.log(str);
        return freightCurr[4]
    }
    return null;
}
//to find Exchange rate
function findFxRate(elem) {
    let exchangeRate = elem.match(/Exchange rate(\S+)(\s+)(.*)(=)(\s+)(\S+)/);
    if (exchangeRate && exchangeRate.length > 0) {
        // let str = " Exchange rate : " + exchangeRate[6];
        // console.log(str);
        return exchangeRate[6];
    }    
    return null;
}
// to find Amount in INR we need to pass FxRate * InVoiVal in currency
function findAmtINR(FxRate,inVoiVal){
    return FxRate * inVoiVal;
}
//to find Social Welfare Surcharge --- roundup
function findsurCharge(elem) {
    let surCharge = elem.match(/Social Welfare Surcharge:(\s+)(\S+)(\s+)(\S+)(\s+)(\s+)(\S+)/);
    if (surCharge && surCharge.length > 0) {
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
function findIGST(elem) {
    let igst = elem.match(/IGST(\s+)(\S+)(\s+)(\S+)(\s+)(\s+)(\S+)(\s+)(\S+)(\s+)(\S+)/);
    if (igst && igst.length > 0) {
        let str = " IGST : " + igst[11];
        // console.log(str);
        return igst[11];
    }
    else {
        return null;
    }
}
//to find country of origin
function findCountry(elem) {
    let cntryOrg = elem.match(/Cntry Of Orgn.:(\s+)(\S+)/);
    console.log(cntryOrg);
    if (cntryOrg && cntryOrg.length > 0) {
        // let str = " country of origin " + cntryOrg[2];
        console.log("cntryOrg  "+cntryOrg[2]);
        return cntryOrg[2];
    }
    return null;
}
//to find air bill number
function findairBillNo(elem) {
    let airBillNo = elem.match(/HAWB No(\s+)(\S+)(\s+)(\S+)/);
    // console.log(airBillNo);
    if (airBillNo && airBillNo.length > 0) {
        // let str = " Air bill NO " + airBillNo[4];
        // console.log("airBillNo:"+airBillNo[4]);
        return airBillNo[4];
    }    
    return null;
}
//to find air bill date
function findairBillDate(elem) {
    let airBillDt = elem.match(/Date(\s+)(\S+)(\s+)(\S+)/);
    // console.log(airBillDt);
    
        if (airBillDt && airBillDt.length > 0) {
            // let str = " Air bill Date " + airBillDt[4];
            // console.log("airBillDt:"+ airBillDt[4]);
            return airBillDt[4];
        }
    return null;
}
//to find CHA
function findCHA(elem) {
    let CHA = elem.match(/CHA(\s+)(\S+)(\s+)(\S+)(\s+)(\[)(.*)(\])/);
    if (CHA && CHA.length > 0) {
        // let str = " CHA :" + CHA[7];
        // console.log("CHA:"+ CHA[7]);
        return CHA[7];
    }
    return null;
}
// to find material index no
function findMaterialIndex(material) {
    let str = material.match(/((###)(\s+)(\d+))/);
    if (str) {
        // console.log(str[4])
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
    let str = material.match(/.*(\s+)(\S+)/);
    if (str) {
        // console.log(str)
        return str[2];
    }
}
//to find ass value
function findAssVal(material) {
    let str = material.match(/(\S+)(\s+)(\S+)/);
    if (str && str.length > 0) {
        // console.log(str)
         return str[3];
    }
}
//to find descrpition
function findDes(material) {
    let desObj = {};
    let str = material.match(/([0-9]{8})(\s+)(.*)(\(([^)]*)\))\(([^)]*)\)/);
    // console.log(str);
    
    if (str && str.length > 0) {
        let qtyStr = str[str.length - 1];
        let qtyArr = qtyStr.match(/[QTY|QYT](\s+)(\d+).*/);

        // qty match and we get part code
        if (qtyArr && qtyArr.length > 0) {

            // console.log("QTY:  " + qtyArr[qtyArr.length - 1]);
            desObj.quantity = qtyArr[qtyArr.length - 1];            // quantity

            // console.log("part code:  "+str[str.length - 2]);
            desObj.partCode = str[str.length - 2];            // partcode

            // console.log("Des:  " + str[str.length - 3]);
            desObj.desOfGoods = str[str.length - 4];

        }
        // qty not present
        else {
            // quantity set to 1
            let str2 = qtyStr.match(/\([A-Z]{3}\S+\)/);

            // only part code present
            if (str2 && str2.length > 0) {
                // console.log(str2);
                desObj.quantity = 1;
                desObj.partCode = str[str.length - 1];
                desObj.desOfGoods = str[str.length - 3];            // partcode
                // console.log(str[str.length-2])
            }
            // part code and camp coms present
            else {
                // let pcStr = str[str.length - 2];
                desObj.quantity = 1;
                desObj.partCode = str[str.length - 2];            // partcode
                desObj.desOfGoods = str[str.length - 4];           //description of goods
            }
        }
       

    }
    else
    {
        str = material.match(/([0-9]{8})(\s+)(.*)(\(([^)]*)\))/);
        if (str && str.length > 0) {
            // console.log(str);
            // let pc = str[str.length - 1];
            // console.log(pc);
            desObj.quantity = 1;
            desObj.partCode = str[str.length - 1];            // partcode
            desObj.desOfGoods = str[str.length - 3];            // description of goods
            console.log("SETTING PART CODE ONLY")
        }
        else
        {
            console.log("UNABLE TO FIND PART CODE. SOMETHING GOES WRONG")    
        }
    }
    return desObj;
}
// (([a-zA-Z0-9]*)\)
// \(([^()]*)\) or \(([^)]+)\)
//([0-9]{8})(\s+)(.*)(\))
//(\()QTY[^()]*\)