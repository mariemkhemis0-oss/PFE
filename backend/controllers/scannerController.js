import Scanner from '../models/Scanner.js';

// GET all scanners
export const getScanners = async (req, res) => {
  try {
    const scanners = await Scanner.find().populate('organizationId');
    res.json(scanners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single scanner
export const getScannerById = async (req, res) => {
  try {
    const scanner = await Scanner.findById(req.params.id).populate('organizationId');
    if (!scanner) {
      return res.status(404).json({ error: 'Scanner not found' });
    }
    res.json(scanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE scanner
export const createScanner = async (req, res) => {
  try {
    const { name, type, organizationId, version } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newScanner = new Scanner({
      name,
      type,
      organizationId: organizationId || null,
      version: version || '1.0',
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
    });

    await newScanner.save();
    res.status(201).json(newScanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE scanner
export const updateScanner = async (req, res) => {
  try {
    const scanner = await Scanner.findById(req.params.id);
    if (!scanner) {
      return res.status(404).json({ error: 'Scanner not found' });
    }

    const { name, type, status, version, healthStatus } = req.body;
    if (name) scanner.name = name;
    if (type) scanner.type = type;
    if (status) scanner.status = status;
    if (version) scanner.version = version;
    if (healthStatus) scanner.healthStatus = healthStatus;

    scanner.lastHealthCheck = new Date();
    scanner.updatedAt = new Date();
    await scanner.save();
    res.json(scanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE scanner
export const deleteScanner = async (req, res) => {
  try {
    const scanner = await Scanner.findByIdAndDelete(req.params.id);
    if (!scanner) {
      return res.status(404).json({ error: 'Scanner not found' });
    }
    res.json({ message: 'Scanner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET scanner health
export const getScannerHealth = async (req, res) => {
  try {
    const scanner = await Scanner.findById(req.params.id);
    if (!scanner) {
      return res.status(404).json({ error: 'Scanner not found' });
    }

    res.json({
      id: scanner._id,
      name: scanner.name,
      status: scanner.status,
      healthStatus: scanner.healthStatus,
      lastHealthCheck: scanner.lastHealthCheck,
      version: scanner.version,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET scanner statistics
export const getScannerStats = async (req, res) => {
  try {
    const total = await Scanner.countDocuments();
    const active = await Scanner.countDocuments({ status: 'ACTIVE' });
    const inactive = await Scanner.countDocuments({ status: 'INACTIVE' });
    const healthy = await Scanner.countDocuments({ healthStatus: 'HEALTHY' });

    const stats = {
      total,
      active,
      inactive,
      healthy,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
