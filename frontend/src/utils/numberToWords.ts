const defaultNumbers = " hai ba bốn năm sáu bảy tám chín";
const chuHangDonVi = ("1 một" + defaultNumbers).split(" ");
const chuHangChuc = ("lẻ mười" + defaultNumbers).split(" ");
const chuHangTram = ("không một" + defaultNumbers).split(" ");

function convertBlockThree(number: string) {
  if (number === "000") return "";
  const _a = number + "";
  
  if (number.length === 3) {
    if (number === "000") return "";
    let _a = number + "";
    let str = "";
    str += chuHangTram[parseInt(_a[0])] + " trăm ";
    if (_a[1] === "0" && _a[2] !== "0") {
      str += "lẻ " + chuHangDonVi[parseInt(_a[2])];
    } else if (_a[1] !== "0") {
      str += chuHangChuc[parseInt(_a[1])] + " mươi ";
      if (_a[2] === "1") str += "mốt";
      else if (_a[2] === "5") str += "lăm";
      else if (_a[2] !== "0") str += chuHangDonVi[parseInt(_a[2])];
    }
    return str.replace("mười mươi", "mười").trim();
  }
  return "";
}

export default function numberToWords(number: number): string {
  if (number === 0) return "không";
  let numStr = Math.abs(number).toString();
  let str = "";
  const suffix = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
  let blockCount = 0;
  
  while (numStr.length > 0) {
    let block = numStr.slice(-3);
    numStr = numStr.slice(0, -3);
    if (block.length === 1) block = "00" + block;
    if (block.length === 2) block = "0" + block;
    let blockWords = convertBlockThree(block);
    if (blockWords) {
      str = blockWords + suffix[blockCount] + " " + str;
    } else if (blockCount > 0 && blockCount % 3 === 0) {
        str = suffix[blockCount] + " " + str;
    }
    blockCount++;
  }
  str = str.replace(/\s+/g, ' ').trim();
  str = str.replace("không trăm lẻ ", "");
  str = str.replace("không trăm mươi ", "");
  str = str.replace("không trăm mốt ", "");
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return (number < 0 ? "Âm " : "") + str;
}
