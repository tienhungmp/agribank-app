import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { Sequelize, DataTypes, Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CẤU HÌNH DATABASE (SQLITE) ---
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false,
});

// --- MODELS ---
const Branch = sequelize.define("Branch", {
  code: { type: DataTypes.STRING(4), primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
});

const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "branch_user"), defaultValue: "branch_user" },
  branchCode: { type: DataTypes.STRING(4) },
  fullName: { type: DataTypes.STRING },
});

const Employee = sequelize.define("Employee", {
  accountNumber: { type: DataTypes.STRING(13), primaryKey: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  taxCode: { type: DataTypes.STRING },
  branchCode: { type: DataTypes.STRING(4), allowNull: false },
  numDependents: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const IncomeTransaction = sequelize.define("IncomeTransaction", {
  accountNumber: { type: DataTypes.STRING(13), allowNull: false },
  branchCode: { type: DataTypes.STRING(4), allowNull: false },
  accountType: { type: DataTypes.STRING(10), allowNull: false },
  amountTaxable: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  transactionDate: { type: DataTypes.DATEONLY, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT },
});

const TaxConfig = sequelize.define("TaxConfig", {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
});

// --- INITIALIZE DATABASE ---
async function initDB() {
  await sequelize.sync();
  
  // Seed Branches
  const branches = [
    { code: "4600", name: "Hội sở" },
    { code: "4601", name: "TP Tuy Hòa" },
    { code: "4602", name: "Tuy An" },
    { code: "4603", name: "Sông Cầu" },
    { code: "4604", name: "Đồng Xuân" },
    { code: "4605", name: "Sơn Hòa" },
    { code: "4606", name: "Sông Hinh" },
    { code: "4607", name: "Nam Tuy Hòa" },
    { code: "4608", name: "Phú Hòa" },
    { code: "4609", name: "Đông Hòa" },
    { code: "4610", name: "Tây Hòa" },
  ];
  for (const b of branches) {
    await Branch.findOrCreate({ where: { code: b.code }, defaults: b });
  }

  // Seed Admin
  const adminExists = await User.findOne({ where: { username: "admin" } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);
    await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      branchCode: "4600",
      fullName: "Quản trị viên Hệ thống",
    });
  }

  // Seed Tax Config
  const configs = [
    { key: "deduct_personal", value: 15500000 },
    { key: "deduct_dependent", value: 6200000 },
    { key: "bracket_1_limit", value: 10000000 },
    { key: "bracket_2_limit", value: 30000000 },
    { key: "bracket_3_limit", value: 60000000 },
    { key: "bracket_4_limit", value: 100000000 },
    { key: "bracket_1_rate", value: 0.05 },
    { key: "bracket_2_rate", value: 0.10 },
    { key: "bracket_3_rate", value: 0.20 },
    { key: "bracket_4_rate", value: 0.30 },
    { key: "bracket_5_rate", value: 0.35 },
  ];
  for (const c of configs) {
    await TaxConfig.findOrCreate({ where: { key: c.key }, defaults: c });
  }
}

// --- HELPER FUNCTIONS ---
function toFullAccountNumber(raw: any) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return "";
  const str = String(raw).trim();
  if (/\d+\.?\d*[eE][+\-]?\d+/.test(str)) {
    return Math.round(parseFloat(str)).toString();
  }
  return str.split(".")[0];
}

function detectAccountType(description: string): string {
  const desc = description.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/đ/g, "d");
  
  if (desc.includes("bao no tsc")) return "BAO_NO";
  if (desc.includes("bao co tsc") || desc.includes("361909")) return "BAO_CO";
  if (desc.includes("quy khen thuong") || desc.includes("khen thuong") || desc.includes("484101")) return "484101";
  if (desc.includes("quy phuc loi") || desc.includes("484201")) return "484201";
  if (desc.includes("luong va phu cap luong co ban") || desc.includes("851101") || desc.includes("luong v1")) return "851101";
  if (desc.includes("thu lao theo hieu qua") || desc.includes("851102") || desc.includes("luong v2")) return "851102";
  if (desc.includes("cac khoan phai tra cho can bo") || desc.includes("462001") || desc.includes("nang suat")) return "462001";
  if (desc.includes("cac khoan chi phuc loi") || desc.includes("891001")) return "891001";
  
  if (desc.includes("doc hai kho quy")) return "DOC_HAI";
  if (desc.includes("phu cap khu vuc")) return "KHU_VUC";
  if (desc.includes("bh bat buoc") || desc.includes("bao hiem")) return "BAO_HIEM";
  if (desc.includes("tu thien")) return "TU_THIEN";
  if (desc.includes("so tien da khau tru")) return "KHAU_TRU";
  
  return "OTHER";
}

// --- EXPRESS APP ---
async function startServer() {
  await initDB();
  const app = express();
  const PORT = 5001;
  const JWT_SECRET = process.env.JWT_SECRET || "agribank_phu_yen_secret_key_2024";

  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan("dev"));
  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  // --- MIDDLEWARE ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user: any = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, branchCode: user.branchCode, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, user: { username: user.username, role: user.role, branchCode: user.branchCode, fullName: user.fullName } });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // Branches
  app.get("/api/branches", authenticate, async (req, res) => {
    const branches = await Branch.findAll();
    res.json(branches);
  });

  // Upload
  app.post("/api/upload/excel", authenticate, upload.single("file"), async (req: any, res) => {
    const { month, year } = req.body;
    if (!req.file) return res.status(400).json({ message: "Không tìm thấy file" });

    try {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: "A" });

      // Bỏ qua header (thường là dòng 1-2)
      const rows = data.slice(1); 
      let successCount = 0;
      let errorLogs: string[] = [];

      for (const row of rows) {
        const fullName = row.B;
        const accountNumber = toFullAccountNumber(row.C);
        const npt = parseInt(row.D) || 0;
        const amountTaxable = parseFloat(row.F) || 0;
        const description = row.H || "";

        // Skip empty rows
        if (!fullName && !accountNumber) continue;

        if (!accountNumber || accountNumber.length !== 13) {
          errorLogs.push(`Dòng lỗi: Số tài khoản ${accountNumber} không hợp lệ (phải 13 số)`);
          continue;
        }

        const accountType = detectAccountType(description);

        // Update Employee
        await Employee.upsert({
          accountNumber,
          fullName,
          branchCode: accountNumber.substring(0, 4),
          numDependents: npt
        });

        // Create Transaction
        await IncomeTransaction.create({
          accountNumber,
          branchCode: accountNumber.substring(0, 4),
          accountType,
          amountTaxable,
          transactionDate: new Date(),
          month: parseInt(month),
          year: parseInt(year),
          description
        });

        successCount++;
      }

      res.json({ successCount, errorLogs });
    } catch (err: any) {
      res.status(500).json({ message: "Lỗi xử lý file: " + err.message });
    }
  });

  // Tax Calculation & Summary
  app.get("/api/tax/summary", authenticate, async (req: any, res) => {
    const { month, year, branchCode } = req.query;
    const where: any = { month, year };
    if (req.user.role !== "admin") where.branchCode = req.user.branchCode;
    else if (branchCode) where.branchCode = branchCode;

    const transactions = await IncomeTransaction.findAll({ where });
    const employees = await Employee.findAll();
    const configs = await TaxConfig.findAll();
    const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: parseFloat(c.value) }), {});

    // Group by account
    const summary: any = {};
    transactions.forEach((t: any) => {
      if (!summary[t.accountNumber]) {
        const emp: any = employees.find((e: any) => e.accountNumber === t.accountNumber);
        summary[t.accountNumber] = {
          accountNumber: t.accountNumber,
          fullName: emp?.fullName || "N/A",
          branchCode: t.branchCode,
          npt: emp?.numDependents || 0,
          income: {
            "851101": 0, "851102": 0, "462001": 0, "484101": 0, "484201": 0, "891001": 0, "BAO_NO": 0, "BAO_CO": 0, "OTHER": 0
          },
          deductFromIncome: {
            "DOC_HAI": 0, "KHU_VUC": 0
          },
          deductFromTaxable: {
            "BAO_HIEM": 0, "TU_THIEN": 0
          },
          withheld: 0
        };
      }
      
      const amount = parseFloat(t.amountTaxable);
      if (summary[t.accountNumber].income.hasOwnProperty(t.accountType)) {
        summary[t.accountNumber].income[t.accountType] += amount;
      } else if (summary[t.accountNumber].deductFromIncome.hasOwnProperty(t.accountType)) {
        summary[t.accountNumber].deductFromIncome[t.accountType] += amount;
      } else if (summary[t.accountNumber].deductFromTaxable.hasOwnProperty(t.accountType)) {
        summary[t.accountNumber].deductFromTaxable[t.accountType] += amount;
      } else if (t.accountType === "KHAU_TRU") {
        summary[t.accountNumber].withheld += amount;
      } else {
        summary[t.accountNumber].income["OTHER"] += amount;
      }
    });

    // Calculate Tax for each
    const results = Object.values(summary).map((s: any) => {
      const totalGross = Object.values(s.income).reduce((a: any, b: any) => a + b, 0) as number;
      const deductHazard = s.deductFromIncome["DOC_HAI"];
      const deductRegional = s.deductFromIncome["KHU_VUC"];
      
      // TNCT = Tổng thu nhập - Phụ cấp độc hại - Phụ cấp khu vực
      const taxableIncome = totalGross - deductHazard - deductRegional;
      
      const deductPersonal = configMap.deduct_personal;
      const deductDependent = s.npt * configMap.deduct_dependent;
      const deductInsurance = s.deductFromTaxable["BAO_HIEM"];
      const deductCharity = s.deductFromTaxable["TU_THIEN"];
      
      const totalFamilyDeduct = deductPersonal + deductDependent;
      const totalDeduction = totalFamilyDeduct + deductInsurance + deductCharity;
      
      const netTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

      let tax = 0;
      const t = netTaxableIncome;
      if (t <= configMap.bracket_1_limit) tax = t * configMap.bracket_1_rate;
      else if (t <= configMap.bracket_2_limit) tax = t * configMap.bracket_2_rate - 500000;
      else if (t <= configMap.bracket_3_limit) tax = t * configMap.bracket_3_rate - 3500000;
      else if (t <= configMap.bracket_4_limit) tax = t * configMap.bracket_4_rate - 9500000;
      else tax = t * configMap.bracket_5_rate - 14500000;

      return {
        ...s,
        totalGross,
        taxableIncome,
        deductHazard,
        deductRegional,
        deductPersonal,
        deductDependent,
        deductInsurance,
        deductCharity,
        totalFamilyDeduct,
        totalDeduction,
        netTaxableIncome,
        taxAmount: Math.round(tax)
      };
    });

    res.json(results);
  });

  // Export
  app.get("/api/export/monthly", authenticate, async (req: any, res) => {
    const { month, year, branchCode } = req.query;
    const where: any = { month, year };
    if (req.user.role !== "admin") where.branchCode = req.user.branchCode;
    else if (branchCode) where.branchCode = branchCode;

    const transactions = await IncomeTransaction.findAll({ where });
    const employees = await Employee.findAll();
    const configs = await TaxConfig.findAll();
    const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: parseFloat(c.value) }), {});

    // Group by account (Same logic as summary)
    const summary: any = {};
    transactions.forEach((t: any) => {
      if (!summary[t.accountNumber]) {
        const emp: any = employees.find((e: any) => e.accountNumber === t.accountNumber);
        summary[t.accountNumber] = {
          accountNumber: t.accountNumber,
          fullName: emp?.fullName || "N/A",
          taxCode: emp?.taxCode || "",
          branchCode: t.branchCode,
          npt: emp?.numDependents || 0,
          income: { "851101": 0, "851102": 0, "462001": 0, "484101": 0, "484201": 0, "891001": 0, "BAO_NO": 0, "BAO_CO": 0, "OTHER": 0 },
          deductFromIncome: { "DOC_HAI": 0, "KHU_VUC": 0 },
          deductFromTaxable: { "BAO_HIEM": 0, "TU_THIEN": 0 },
          withheld: 0
        };
      }
      const amount = parseFloat(t.amountTaxable);
      if (summary[t.accountNumber].income.hasOwnProperty(t.accountType)) summary[t.accountNumber].income[t.accountType] += amount;
      else if (summary[t.accountNumber].deductFromIncome.hasOwnProperty(t.accountType)) summary[t.accountNumber].deductFromIncome[t.accountType] += amount;
      else if (summary[t.accountNumber].deductFromTaxable.hasOwnProperty(t.accountType)) summary[t.accountNumber].deductFromTaxable[t.accountType] += amount;
      else if (t.accountType === "KHAU_TRU") summary[t.accountNumber].withheld += amount;
      else summary[t.accountNumber].income["OTHER"] += amount;
    });

    const results = Object.values(summary).map((s: any) => {
      const totalGross = Object.values(s.income).reduce((a: any, b: any) => a + b, 0) as number;
      const deductHazard = s.deductFromIncome["DOC_HAI"];
      const deductRegional = s.deductFromIncome["KHU_VUC"];
      const taxableIncome = totalGross - deductHazard - deductRegional;
      const deductPersonal = configMap.deduct_personal;
      const deductDependent = s.npt * configMap.deduct_dependent;
      const deductInsurance = s.deductFromTaxable["BAO_HIEM"];
      const deductCharity = s.deductFromTaxable["TU_THIEN"];
      const totalFamilyDeduct = deductPersonal + deductDependent;
      const totalDeduction = totalFamilyDeduct + deductInsurance + deductCharity;
      const netTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

      let tax = 0;
      const t = netTaxableIncome;
      if (t <= configMap.bracket_1_limit) tax = t * configMap.bracket_1_rate;
      else if (t <= configMap.bracket_2_limit) tax = t * configMap.bracket_2_rate - 500000;
      else if (t <= configMap.bracket_3_limit) tax = t * configMap.bracket_3_rate - 3500000;
      else if (t <= configMap.bracket_4_limit) tax = t * configMap.bracket_4_rate - 9500000;
      else tax = t * configMap.bracket_5_rate - 14500000;

      return { ...s, totalGross, taxableIncome, deductHazard, deductRegional, deductPersonal, deductDependent, deductInsurance, deductCharity, totalFamilyDeduct, totalDeduction, netTaxableIncome, taxAmount: Math.round(tax) };
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("BKTN");

    // Header
    sheet.mergeCells("A1:AB1");
    sheet.getCell("A1").value = "NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN VIỆT NAM";
    sheet.getCell("A1").font = { bold: true };

    sheet.mergeCells("A2:AB2");
    sheet.getCell("A2").value = `CHI NHÁNH: ${branchCode || req.user.branchCode}`;

    sheet.mergeCells("A3:AB3");
    sheet.getCell("A3").value = `BẢNG KÊ THU NHẬP CHỊU THUẾ VÀ THUẾ TNCN ĐÃ KHẤU TRỪ ĐỐI VỚI THU NHẬP TỪ TIỀN LƯƠNG TIỀN CÔNG THÁNG ${month} NĂM ${year}`;
    sheet.getCell("A3").alignment = { horizontal: "center" };
    sheet.getCell("A3").font = { bold: true, size: 14 };

    sheet.mergeCells("A4:W4");
    sheet.getCell("A4").value = "Địa chỉ: ……………    Mã số thuế: ……………";
    sheet.mergeCells("X4:AB4");
    sheet.getCell("X4").value = "Đơn vị tính: VND";
    sheet.getCell("X4").alignment = { horizontal: "right" };

    // Column Headers (Simplified for brevity, but following the structure)
    const headerRow = ["STT", "Họ và tên", "Mã số thuế", "Lương V1", "Lương V2", "Năng suất", "Khen thưởng", "Phúc lợi 891", "Khác", "", "Độc hại", "Khu vực", "TNCT", "Số NPT", "Tháng GT", "GT NPT", "GT Bản thân", "Tổng GT GC", "BH bắt buộc", "", "Từ thiện", "Tổng GT", "TNTT", "Thuế TNCN", "GHI CHÚ", "", "TNCT khấu trừ", "Số cá nhân"];
    sheet.addRow(headerRow);
    
    // Data Rows
    results.forEach((r: any, idx) => {
      sheet.addRow([
        idx + 1,
        r.fullName,
        r.taxCode,
        r.income["851101"],
        r.income["851102"],
        r.income["462001"],
        r.income["484101"],
        r.income["891001"],
        r.income["OTHER"] + r.income["BAO_NO"] + r.income["BAO_CO"],
        "",
        r.deductHazard,
        r.deductRegional,
        r.taxableIncome,
        r.npt,
        1,
        r.deductDependent,
        r.deductPersonal,
        r.totalFamilyDeduct,
        r.deductInsurance,
        "",
        r.deductCharity,
        r.totalDeduction,
        r.netTaxableIncome,
        r.taxAmount,
        "",
        "",
        r.taxAmount > 0 ? r.taxableIncome : "",
        r.taxAmount > 0 ? 1 : ""
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${branchCode || "BKTN"}_Thang${month}_Nam${year}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  });

  // Config
  app.get("/api/config/tax", authenticate, async (req, res) => {
    const configs = await TaxConfig.findAll();
    res.json(configs);
  });

  app.put("/api/config/tax", authenticate, async (req: any, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { configs } = req.body;
    for (const c of configs) {
      await TaxConfig.update({ value: c.value }, { where: { key: c.key } });
    }
    res.json({ message: "Cập nhật thành công" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
