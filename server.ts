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
  categoryCode: { type: DataTypes.STRING(20) },
  accountContent: { type: DataTypes.STRING(50) },
  amountTaxable: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  transactionDate: { type: DataTypes.DATEONLY, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING, defaultValue: "Excel Upload" },
  uploadLogId: { type: DataTypes.STRING },
});

const UploadLog = sequelize.define("UploadLog", {
  id: { type: DataTypes.STRING, primaryKey: true },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  branchCode: { type: DataTypes.STRING(4), allowNull: false },
  uploadedBy: { type: DataTypes.STRING, allowNull: false },
  recordCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  fileName: { type: DataTypes.STRING },
});

const TaxConfig = sequelize.define("TaxConfig", {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
});

// Associations
IncomeTransaction.belongsTo(Employee, { foreignKey: 'accountNumber' });
Employee.hasMany(IncomeTransaction, { foreignKey: 'accountNumber' });

// --- INITIALIZE DATABASE ---
async function initDB() {
  await sequelize.sync();

  // Fix for missing 'source' column in IncomeTransactions
  try {
    const tableInfo: any = await sequelize.query("PRAGMA table_info(IncomeTransactions)");
    const hasSource = tableInfo[0].some((col: any) => col.name === 'source');
    if (!hasSource) {
      await sequelize.query("ALTER TABLE IncomeTransactions ADD COLUMN source TEXT DEFAULT 'Excel Upload'");
      console.log("Added missing 'source' column to IncomeTransactions");
    }

    const empTableInfo: any = await sequelize.query("PRAGMA table_info(Employees)");
    const hasNumDependents = empTableInfo[0].some((col: any) => col.name === 'numDependents');
    if (!hasNumDependents) {
      await sequelize.query("ALTER TABLE Employees ADD COLUMN numDependents INTEGER DEFAULT 0");
      console.log("Added missing 'numDependents' column to Employees");
    }

    const hasTaxCode = empTableInfo[0].some((col: any) => col.name === 'taxCode');
    if (!hasTaxCode) {
      await sequelize.query("ALTER TABLE Employees ADD COLUMN taxCode TEXT");
      console.log("Added missing 'taxCode' column to Employees");
    }

    const hasAccountContent = tableInfo[0].some((col: any) => col.name === 'accountContent');
    if (!hasAccountContent) {
      await sequelize.query("ALTER TABLE IncomeTransactions ADD COLUMN accountContent TEXT");
      console.log("Added missing 'accountContent' column to IncomeTransactions");
    }

    const hasCategoryCode = tableInfo[0].some((col: any) => col.name === 'categoryCode');
    if (!hasCategoryCode) {
      await sequelize.query("ALTER TABLE IncomeTransactions ADD COLUMN categoryCode TEXT");
      console.log("Added missing 'categoryCode' column to IncomeTransactions");
    }

    const hasUploadLogId = tableInfo[0].some((col: any) => col.name === 'uploadLogId');
    if (!hasUploadLogId) {
      await sequelize.query("ALTER TABLE IncomeTransactions ADD COLUMN uploadLogId TEXT");
      console.log("Added missing 'uploadLogId' column to IncomeTransactions");
    }
  } catch (err) {
    console.error("Error checking/adding columns:", err);
  }
  
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
function calculatePIT(netTaxableIncome: number): number {
  if (netTaxableIncome <= 0) return 0;
  
  // Biểu thuế lũy tiến từng phần (Tháng)
  // 1: Đến 5tr - 5%
  // 2: 5tr -> 10tr - 10%
  // 3: 10tr -> 18tr - 15%
  // 4: 18tr -> 32tr - 20%
  // 5: 32tr -> 52tr - 25%
  // 6: 52tr -> 80tr - 30%
  // 7: Trên 80tr - 35%

  if (netTaxableIncome <= 5000000) return netTaxableIncome * 0.05;
  if (netTaxableIncome <= 10000000) return netTaxableIncome * 0.1 - 250000;
  if (netTaxableIncome <= 18000000) return netTaxableIncome * 0.15 - 750000;
  if (netTaxableIncome <= 32000000) return netTaxableIncome * 0.2 - 1650000;
  if (netTaxableIncome <= 52000000) return netTaxableIncome * 0.25 - 3250000;
  if (netTaxableIncome <= 80000000) return netTaxableIncome * 0.3 - 5850000;
  return netTaxableIncome * 0.35 - 9850000;
}

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
  
  if (desc.includes("361909") || desc.includes("thu chi thuong")) return "361909";
  if (desc.includes("484101") || desc.includes("khen thuong")) return "484101";
  if (desc.includes("484201") || desc.includes("phuc loi")) return "484201";
  if (desc.includes("851101") || desc.includes("luong co ban") || desc.includes("luong v1")) return "851101";
  if (desc.includes("851102") || desc.includes("hieu qua cong viec") || desc.includes("v2")) return "851102";
  if (desc.includes("462001") || desc.includes("tra cho can bo")) return "462001";
  if (desc.includes("891001") || desc.includes("chi co tinh chat phuc loi")) return "891001";
  
  if (desc.includes("doc hai")) return "ALLOW_DOC_HAI";
  if (desc.includes("khu vuc")) return "ALLOW_KHU_VUC";
  if (desc.includes("bh bat buoc") || desc.includes("bao hiem")) return "ALLOW_BH";
  if (desc.includes("tu thien")) return "ALLOW_TU_THIEN";
  if (desc.includes("giam tru ca nhan")) return "DEDUCT_PERSONAL";
  if (desc.includes("giam tru npt")) return "DEDUCT_DEPENDENT";
  
  return "OTHER";
}

// --- EXPRESS APP ---
async function startServer() {
  await initDB();
  const app = express();
  const PORT = 3000;
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
    try {
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
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    try {
      res.json(req.user);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Branches
  app.get("/api/branches", authenticate, async (req, res) => {
    try {
      const branches = await Branch.findAll();
      res.json(branches);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Upload - Parse and return preview
  app.post("/api/upload/excel", authenticate, upload.single("file"), async (req: any, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return res.status(400).json({ message: "Thiếu thông tin tháng hoặc năm" });
      
      const m = parseInt(month);
      const y = parseInt(year);
      if (isNaN(m) || isNaN(y)) return res.status(400).json({ message: "Thông tin tháng hoặc năm không hợp lệ" });

      if (!req.file) return res.status(400).json({ message: "Không tìm thấy file" });

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: "A" });

      // Cột B: Họ và tên
      // Cột C: Số tài khoản (13 số)
      // Cột D: Số tiền chỉ hiển thị để thống kê
      // Cột E: Số tiền chịu thuế
      // Cột F: Thời gian phát sinh
      // Cột G: Nội dung chi tiết
      const rows = data.slice(1); 
      const previewRows = rows.map((row) => {
        const fullName = row.B;
        const accountNumber = toFullAccountNumber(row.C);
        const amountStat = parseFloat(row.D) || 0; // Thống kê
        const amountTaxable = parseFloat(row.E) || 0; // Thuế
        const dateOccurred = row.F || "";
        const content = row.G || "";

        if (!fullName && !accountNumber) return null;

        return {
          fullName,
          accountNumber,
          amountStat,
          amountTaxable,
          dateOccurred,
          content,
          suggestedCategory: detectAccountType(content)
        };
      }).filter(r => r !== null);

      res.json({ rows: previewRows, m, y });
    } catch (err: any) {
      res.status(500).json({ message: "Lỗi xử lý file: " + err.message });
    }
  });

  app.post("/api/transactions/bulk", authenticate, async (req: any, res) => {
    try {
      const { rows, month, year } = req.body;
      if (!rows || !Array.isArray(rows)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

      let successCount = 0;
      const source = "Excel Review Upload";
      const logId = `UP-${Date.now()}-${Math.floor(Math.random()*1000)}`;

      // Create Upload Log
      await (UploadLog as any).create({
        id: logId,
        month,
        year,
        branchCode: req.user.branchCode || "4600",
        uploadedBy: req.user.username,
        recordCount: rows.length,
        fileName: `Upload_${month}_${year}`
      });

      for (const row of rows) {
        const { fullName, accountNumber, amountTaxable, content, dateOccurred, categoryCode } = row;
        
        if (!accountNumber) continue;
        const branchCode = accountNumber.substring(0, 4);

        // Safely update Employee
        let emp: any = await Employee.findByPk(accountNumber);
        if (!emp) {
          await Employee.create({
            accountNumber,
            fullName,
            branchCode,
          });
        } else {
          // Update branch or name if they've changed
          let changed = false;
          if (emp.fullName !== fullName) { emp.fullName = fullName; changed = true; }
          if (emp.branchCode !== branchCode) { emp.branchCode = branchCode; changed = true; }
          if (changed) await emp.save();
        }

        // Handle Date parsing carefully
        let tDate = new Date(dateOccurred);
        if (isNaN(tDate.getTime())) {
          // If invalid date, construct from selected month/year
          tDate = new Date(year, month - 1, 15);
        }

        // Create Transaction
        await IncomeTransaction.create({
          accountNumber,
          branchCode,
          accountType: categoryCode || "OTHER",
          categoryCode: categoryCode || "OTHER",
          amountTaxable,
          transactionDate: tDate,
          month,
          year,
          description: content || `Kết chuyển ${month}/${year}`,
          source,
          uploadLogId: logId
        });

        successCount++;
      }

      res.json({ successCount, logId });
    } catch (err: any) {
      res.status(500).json({ message: "Lỗi lưu dữ liệu: " + err.message });
    }
  });

  // History Endpoints
  app.get("/api/history/uploads", authenticate, async (req: any, res) => {
    try {
      const { month, year } = req.query;
      const where: any = {};
      if (month && month !== 'all') where.month = parseInt(month as string);
      if (year && year !== 'all') where.year = parseInt(year as string);
      
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode;
      }

      const logs = await UploadLog.findAll({ 
        where,
        order: [['createdAt', 'DESC']]
      });
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/history/uploads/:id", authenticate, async (req, res) => {
    try {
      const transactions = await IncomeTransaction.findAll({
        where: { uploadLogId: req.params.id },
        include: [{ model: Employee, attributes: ['fullName'] }]
      });
      // Flatten the fullName into the object for the frontend
      const flatTransactions = transactions.map((t: any) => {
        const plain = t.get({ plain: true });
        return {
          ...plain,
          fullName: plain.Employee?.fullName || "N/A"
        };
      });
      res.json(flatTransactions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/history/employee/:accountNumber", authenticate, async (req, res) => {
    try {
      const transactions = await IncomeTransaction.findAll({
        where: { accountNumber: req.params.accountNumber },
        order: [['transactionDate', 'DESC']],
        include: [{ model: Employee, attributes: ['fullName'] }]
      });
      const flatTransactions = transactions.map((t: any) => {
        const plain = t.get({ plain: true });
        return {
          ...plain,
          fullName: plain.Employee?.fullName || "N/A"
        };
      });
      res.json(flatTransactions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  // Tax Calculation & Summary
  app.get("/api/tax/summary", authenticate, async (req: any, res) => {
    try {
      const { month, year, branchCode, source, categoryCode } = req.query;
      if (!year || isNaN(parseInt(year as string))) return res.status(400).json({ message: "Thông tin năm không hợp lệ" });
      
      const where: any = { year: parseInt(year as string) };
      if (month && month !== 'all') {
        if (isNaN(parseInt(month as string))) return res.status(400).json({ message: "Thông tin tháng không hợp lệ" });
        where.month = parseInt(month as string);
      }
      
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode;
      } else if (branchCode) {
        where.branchCode = branchCode;
      }

      if (source) {
        where.source = source;
      }

      if (categoryCode) {
        where.categoryCode = categoryCode;
      }

      const transactions = await IncomeTransaction.findAll({ where });
      const employees = await Employee.findAll();
      const configs = await TaxConfig.findAll();
      
      const defaultConfig = {
        deduct_personal: 11000000,
        deduct_dependent: 4400000,
        bracket_1_limit: 5000000,
        bracket_2_limit: 10000000,
        bracket_3_limit: 18000000,
        bracket_4_limit: 32000000,
        bracket_1_rate: 0.05,
        bracket_2_rate: 0.10,
        bracket_3_rate: 0.15,
        bracket_4_rate: 0.20,
        bracket_5_rate: 0.25
      };

      const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: parseFloat(c.value) }), { ...defaultConfig });

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
              "851101": 0, "851102": 0, "462001": 0, "484101": 0, "484201": 0, "891001": 0, "361909": 0, "OTHER": 0 
            },
            deductFromIncome: {
              "DOC_HAI": 0, "KHU_VUC": 0
            },
            deductFromTaxable: {
              "BAO_HIEM": 0, "TU_THIEN": 0, "PERSONAL": 0, "DEPENDENT": 0
            },
            withheld: 0,
            sources: new Set()
          };
        }
        
        const s = summary[t.accountNumber];
        s.sources.add(t.source);
        const amount = parseFloat(t.amountTaxable) || 0;
        const code = t.categoryCode || 'OTHER';

        if (["851101", "851102", "462001", "484101", "484201", "891001", "361909", "OTHER"].includes(code)) {
            s.income[code] += amount;
        } else if (code === "ALLOW_DOC_HAI") {
            s.deductFromIncome["DOC_HAI"] += amount;
        } else if (code === "ALLOW_KHU_VUC") {
            s.deductFromIncome["KHU_VUC"] += amount;
        } else if (code === "ALLOW_BH") {
            s.deductFromTaxable["BAO_HIEM"] += amount;
        } else if (code === "ALLOW_TU_THIEN") {
            s.deductFromTaxable["TU_THIEN"] += amount;
        } else if (code === "DEDUCT_PERSONAL") {
            s.deductFromTaxable["PERSONAL"] += amount;
        } else if (code === "DEDUCT_DEPENDENT") {
            s.deductFromTaxable["DEPENDENT"] += amount;
        } else if (code === "KHAU_TRU") {
            s.withheld += amount;
        } else {
            s.income["OTHER"] += amount;
        }
      });

      // Calculate Tax for each
      const results = Object.values(summary).map((s: any) => {
        const totalGross = Object.values(s.income).reduce((a: any, b: any) => a + b, 0) as number;
        
        const deductHazard = s.deductFromIncome["DOC_HAI"] || 0;
        const deductRegional = s.deductFromIncome["KHU_VUC"] || 0;
        const taxableIncome = Math.max(0, totalGross - deductHazard - deductRegional); 
        
        const deductPersonal = s.deductFromTaxable["PERSONAL"] || 0;
        const deductDependent = s.deductFromTaxable["DEPENDENT"] || 0;
        const deductInsurance = s.deductFromTaxable["BAO_HIEM"] || 0;
        const deductCharity = s.deductFromTaxable["TU_THIEN"] || 0;
        
        const totalDeduction = deductPersonal + deductDependent + deductInsurance + deductCharity;
        const netTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

        let tax = calculatePIT(netTaxableIncome);

        return {
          ...s,
          sources: Array.from(s.sources),
          totalGross,
          taxableIncome,
          deductHazard,
          deductRegional,
          deductPersonal,
          deductDependent,
          deductInsurance,
          deductCharity,
          totalFamilyDeduct: deductPersonal + deductDependent,
          totalDeduction,
          netTaxableIncome,
          taxAmount: Math.round(tax)
        };
      });

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Delete Transactions
  app.delete("/api/transactions", authenticate, async (req: any, res) => {
    try {
      const { month, year, branchCode } = req.query;
      if (!year || isNaN(parseInt(year as string))) return res.status(400).json({ message: "Thông tin năm không hợp lệ" });

      const where: any = { year: parseInt(year as string) };
      if (month && month !== 'all') {
        if (isNaN(parseInt(month as string))) return res.status(400).json({ message: "Thông tin tháng không hợp lệ" });
        where.month = parseInt(month as string);
      }
      
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode;
      } else if (branchCode) {
        where.branchCode = branchCode;
      }

      const count = await IncomeTransaction.destroy({ where });
      res.json({ message: `Đã xóa ${count} bản ghi`, count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get Upload History (Summary of transactions by month/year/branch)
  app.get("/api/upload/history", authenticate, async (req: any, res) => {
    try {
      const where: any = {};
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode;
      }

      const history = await IncomeTransaction.findAll({
        attributes: [
          'month', 'year', 'branchCode', 'source',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amountTaxable')), 'totalAmount']
        ],
        where,
        group: ['month', 'year', 'branchCode', 'source'],
        order: [['year', 'DESC'], ['month', 'DESC']]
      });

      res.json(history);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Export
  app.get("/api/export/monthly", authenticate, async (req: any, res) => {
    try {
      const { month, year, branchCode } = req.query;
      if (!year || isNaN(parseInt(year as string))) return res.status(400).json({ message: "Thông tin năm không hợp lệ" });
      
      const where: any = { year: parseInt(year as string) };
      if (month && month !== 'all') {
        if (isNaN(parseInt(month as string))) return res.status(400).json({ message: "Thông tin tháng không hợp lệ" });
        where.month = parseInt(month as string);
      }

      if (req.user.role !== "admin") where.branchCode = req.user.branchCode;
      else if (branchCode) where.branchCode = branchCode;

      const transactions = await IncomeTransaction.findAll({ where });
      const employees = await Employee.findAll();
      const configs = await TaxConfig.findAll();
      
      const defaultConfig = {
        deduct_personal: 11000000,
        deduct_dependent: 4400000,
        bracket_1_limit: 5000000,
        bracket_2_limit: 10000000,
        bracket_3_limit: 18000000,
        bracket_4_limit: 32000000,
        bracket_1_rate: 0.05,
        bracket_2_rate: 0.10,
        bracket_3_rate: 0.15,
        bracket_4_rate: 0.20,
        bracket_5_rate: 0.25
      };

      const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: parseFloat(c.value) }), { ...defaultConfig });

      // Group by account
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
            income: { "851101": 0, "851102": 0, "462001": 0, "484101": 0, "484201": 0, "891001": 0, "361909": 0, "OTHER": 0 },
            deductFromIncome: { "DOC_HAI": 0, "KHU_VUC": 0 },
            deductFromTaxable: { "BAO_HIEM": 0, "TU_THIEN": 0, "PERSONAL": 0, "DEPENDENT": 0 },
            withheld: 0
          };
        }
        
        const s = summary[t.accountNumber];
        const amount = parseFloat(t.amountTaxable) || 0;
        const code = t.categoryCode || 'OTHER';

        if (["851101", "851102", "462001", "484101", "484201", "891001", "361909", "OTHER"].includes(code)) {
            s.income[code] += amount;
        } else if (code === "ALLOW_DOC_HAI") {
            s.deductFromIncome["DOC_HAI"] += amount;
        } else if (code === "ALLOW_KHU_VUC") {
            s.deductFromIncome["KHU_VUC"] += amount;
        } else if (code === "ALLOW_BH") {
            s.deductFromTaxable["BAO_HIEM"] += amount;
        } else if (code === "ALLOW_TU_THIEN") {
            s.deductFromTaxable["TU_THIEN"] += amount;
        } else if (code === "DEDUCT_PERSONAL") {
            s.deductFromTaxable["PERSONAL"] += amount;
        } else if (code === "DEDUCT_DEPENDENT") {
            s.deductFromTaxable["DEPENDENT"] += amount;
        } else if (code === "KHAU_TRU") {
            s.withheld += amount;
        } else {
            s.income["OTHER"] += amount;
        }
      });

      const isYearly = !month;
      const multiplier = isYearly ? 12 : 1;

      const results = Object.values(summary).map((s: any) => {
        const totalGross = Object.values(s.income).reduce((a: any, b: any) => a + b, 0) as number;
        
        const deductHazard = s.deductFromIncome["DOC_HAI"] || 0;
        const deductRegional = s.deductFromIncome["KHU_VUC"] || 0;
        const taxableIncome = Math.max(0, totalGross - deductHazard - deductRegional); 
        
        const deductPersonal = s.deductFromTaxable["PERSONAL"] || 0;
        const deductDependent = s.deductFromTaxable["DEPENDENT"] || 0;
        const deductInsurance = s.deductFromTaxable["BAO_HIEM"] || 0;
        const deductCharity = s.deductFromTaxable["TU_THIEN"] || 0;
        
        const totalFamilyDeduct = deductPersonal + deductDependent;
        const totalDeduction = totalFamilyDeduct + deductInsurance + deductCharity;
        const netTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

        let tax = calculatePIT(netTaxableIncome);

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

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("BKTN", {
        views: [{ state: 'frozen', ySplit: 5 }]
      });

      // Styles & Branding
      const MAROON = '8B1D1D';
      const BORDER_STYLE: any = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };

      // Header Rows styling
      sheet.mergeCells("A1:AB1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN VIỆT NAM";
      titleCell.font = { bold: true, color: { argb: MAROON }, size: 12 };

      sheet.mergeCells("A2:AB2");
      sheet.getCell("A2").value = `CHI NHÁNH: ${branchCode || req.user.branchCode}`;
      sheet.getCell("A2").font = { bold: true };

      sheet.mergeCells("A3:AB3");
      const subTitleCell = sheet.getCell("A3");
      subTitleCell.value = `BẢNG KÊ THU NHẬP CHỊU THUẾ VÀ THUẾ TNCN ĐÃ KHẤU TRỪ ĐỐI VỚI THU NHẬP TỪ TIỀN LƯƠNG TIỀN CÔNG ${isYearly ? `NĂM ${year}` : `THÁNG ${month} NĂM ${year}`}`;
      subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
      subTitleCell.font = { bold: true, size: 16, color: { argb: MAROON } };
      sheet.getRow(3).height = 35;

      sheet.mergeCells("A4:W4");
      sheet.getCell("A4").value = "Địa chỉ: ……………    Mã số thuế: ……………";
      sheet.mergeCells("X4:AB4");
      sheet.getCell("X4").value = "Đơn vị tính: VND";
      sheet.getCell("X4").alignment = { horizontal: "right" };

      // Table Column Headers
      const headerRowValues = ["STT", "Họ và tên", "Mã số thuế", "Lương V1", "Lương V2", "Năng suất", "Khen thưởng", "Phúc lợi 891", "Khác", "", "Độc hại", "Khu vực", "TNCT", "Số NPT", "Tháng GT", "GT NPT", "GT Bản thân", "Tổng GT GC", "BH bắt buộc", "", "Từ thiện", "Tổng GT", "TNTT", "Thuế TNCN", "GHI CHÚ", "", "TNCT khấu trừ", "Số tiền thuế đã khấu trừ"];
      const headerRow = sheet.addRow(headerRowValues);
      headerRow.height = 40;
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAROON } };
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = BORDER_STYLE;
      });

      // Set Column Widths
      sheet.columns = [
        { width: 5 }, { width: 25 }, { width: 15 }, { width: 12 }, { width: 12 }, 
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 3 }, 
        { width: 12 }, { width: 12 }, { width: 15 }, { width: 8 }, { width: 8 }, 
        { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 3 }, 
        { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, 
        { width: 3 }, { width: 15 }, { width: 20 }
      ];
      
      // Data Rows
      results.forEach((r: any, idx) => {
        const row = sheet.addRow([
          idx + 1,
          r.fullName,
          r.taxCode,
          r.income["851101"] || 0,
          r.income["851102"] || 0,
          r.income["462001"] || 0,
          r.income["484101"] || 0,
          r.income["891001"] || 0,
          (r.income["OTHER"] || 0) + (r.income["361909"] || 0),
          "",
          r.deductHazard || 0,
          r.deductRegional || 0,
          r.taxableIncome || 0,
          r.npt || 0,
          multiplier,
          r.deductDependent || 0,
          r.deductPersonal || 0,
          r.totalFamilyDeduct || 0,
          r.deductInsurance || 0,
          "",
          r.deductCharity || 0,
          r.totalDeduction || 0,
          r.netTaxableIncome || 0,
          r.taxAmount || 0,
          "",
          "",
          r.taxAmount > 0 ? (r.taxableIncome || 0) : 0,
          r.taxAmount || 0
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = BORDER_STYLE;
          cell.font = { size: 10 };
          
          if (colNumber === 1) cell.alignment = { horizontal: 'center' };
          else if (colNumber === 2 || colNumber === 3) cell.alignment = { horizontal: 'left' };
          else cell.alignment = { horizontal: 'right' };

          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9F9F9' } };
          }

          if ([4, 5, 6, 7, 8, 9, 11, 12, 13, 16, 17, 18, 19, 21, 22, 23, 24, 27, 28].includes(colNumber)) {
            cell.numFmt = '#,##0';
          }
        });
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${branchCode || "BKTN"}_${isYearly ? `Nam${year}` : `Thang${month}_Nam${year}`}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Statistics
  app.get("/api/stats/income-summary", authenticate, async (req: any, res) => {
    try {
      const { month, year, branchCode, categoryCode } = req.query;
      
      const where: any = {
        month: parseInt(month as string),
        year: parseInt(year as string),
      };

      if (categoryCode && categoryCode !== 'all') {
        where.categoryCode = categoryCode;
      }

      if (branchCode && branchCode !== 'all') {
        where.branchCode = branchCode;
      }
      
      // If user is not admin, restrict to their branch
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode || "4600";
      }

      // Count unique employees and sum amount
      const stats = await IncomeTransaction.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amountTaxable')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('accountNumber'))), 'employeeCount']
        ],
        where
      });

      const result = stats[0].get({ plain: true });
      res.json({
        totalAmount: parseFloat(result.totalAmount) || 0,
        employeeCount: result.employeeCount || 0
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get detailed stats per branch (for comparison)
  app.get("/api/stats/branches-breakdown", authenticate, async (req: any, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Từ chối truy cập" });
    
    try {
      const { month, year, categoryCode } = req.query;
      const where: any = {
        month: parseInt(month as string),
        year: parseInt(year as string),
      };
      if (categoryCode && categoryCode !== 'all') where.categoryCode = categoryCode;

      const breakdown = await IncomeTransaction.findAll({
        attributes: [
          'branchCode',
          [sequelize.fn('SUM', sequelize.col('amountTaxable')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('accountNumber'))), 'employeeCount']
        ],
        where,
        group: ['branchCode']
      });

      res.json(breakdown);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Detailed search for reports
  app.get("/api/stats/income-details", authenticate, async (req: any, res) => {
    try {
      const { month, year, branchCode, categoryCode } = req.query;
      const where: any = {
        month: parseInt(month as string),
        year: parseInt(year as string),
      };

      if (categoryCode && categoryCode !== 'all') where.categoryCode = categoryCode;
      if (branchCode && branchCode !== 'all') where.branchCode = branchCode;
      
      if (req.user.role !== "admin") {
        where.branchCode = req.user.branchCode || "4600";
      }

      const transactions = await IncomeTransaction.findAll({
        where,
        include: [{ model: Employee, attributes: ['fullName'] }],
        order: [['amountTaxable', 'DESC']]
      });

      const flat = transactions.map((t: any) => {
        const plain = t.get({ plain: true });
        return {
          ...plain,
          fullName: plain.Employee?.fullName || "N/A"
        };
      });

      res.json(flat);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get detailed income for an employee
  app.get("/api/employees/:accountNumber/income", authenticate, async (req: any, res) => {
    try {
      const { accountNumber } = req.params;
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ message: "Thiếu tháng hoặc năm" });

      const transactions = await IncomeTransaction.findAll({
        where: { accountNumber, month: parseInt(month as string), year: parseInt(year as string) }
      });

      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Update employee income transactions
  app.put("/api/employees/:accountNumber/income", authenticate, async (req: any, res) => {
    try {
      const { accountNumber } = req.params;
      const { month, year, incomeItems } = req.body; // incomeItems: { categoryCode: amount }
      
      if (!month || !year || !incomeItems) return res.status(400).json({ message: "Thiếu thông tin cập nhật" });

      const m = parseInt(month);
      const y = parseInt(year);

      const emp: any = await Employee.findByPk(accountNumber);
      if (!emp) return res.status(404).json({ message: "Không tìm thấy cán bộ" });

      for (const [code, amount] of Object.entries(incomeItems)) {
        const val = parseFloat(amount as string) || 0;
        
        // Find if transaction exists for this category in this period
        const existing = await IncomeTransaction.findOne({
          where: { accountNumber, month: m, year: y, categoryCode: code }
        });

        if (existing) {
          if (val === 0) {
            await existing.destroy();
          } else {
            await existing.update({ amountTaxable: val });
          }
        } else if (val > 0) {
          await IncomeTransaction.create({
            accountNumber,
            branchCode: emp.branchCode,
            accountType: code, // Fallback
            categoryCode: code,
            amountTaxable: val,
            transactionDate: `${y}-${String(m).padStart(2, '0')}-01`,
            month: m,
            year: y,
            source: "Manual Update",
            description: `Cập nhật thủ công ${m}/${y}`
          });
        }
      }

      res.json({ message: "Cập nhật thành công" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Config
  app.get("/api/config/tax", authenticate, async (req, res) => {
    try {
      const configs = await TaxConfig.findAll();
      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/config/tax", authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      const { configs } = req.body;
      for (const c of configs) {
        await TaxConfig.update({ value: c.value }, { where: { key: c.key } });
      }
      res.json({ message: "Cập nhật thành công" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/employees/:accountNumber", authenticate, async (req, res) => {
    const { accountNumber } = req.params;
    const { numDependents, fullName } = req.body;

    try {
      const employee = await Employee.findByPk(accountNumber);
      if (!employee) return res.status(404).json({ message: "Không tìm thấy nhân viên" });

      if (numDependents !== undefined) (employee as any).numDependents = numDependents;
      if (fullName !== undefined) (employee as any).fullName = fullName;

      await employee.save();
      res.json(employee);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ message: "Lỗi hệ thống không mong muốn: " + err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
