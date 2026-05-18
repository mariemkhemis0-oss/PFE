import Host from '../models/Host.js';

// GET all hosts
export const getHosts = async (req, res) => {
  try {
    const { status, organizationId } = req.query;
    let query = {};

    if (status) query.status = status.toUpperCase();
    if (organizationId) query.organizationId = organizationId;

    const hosts = await Host.find(query)
      .populate('organizationId')
      .populate('scannerIds')
      .populate('vulnerabilities');
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single host
export const getHostById = async (req, res) => {
  try {
    const host = await Host.findById(req.params.id)
      .populate('organizationId')
      .populate('scannerIds')
      .populate('vulnerabilities');
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    res.json(host);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE host
export const createHost = async (req, res) => {
  try {
    const { hostname, ipAddress, organizationId, operatingSystem } = req.body;
    if (!hostname || !ipAddress || !organizationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newHost = new Host({
      hostname,
      ipAddress,
      organizationId,
      operatingSystem: operatingSystem || 'Unknown',
      status: 'ACTIVE',
    });

    await newHost.save();
    res.status(201).json(newHost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE host
export const updateHost = async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const { hostname, ipAddress, operatingSystem, status, lastScanned } = req.body;
    if (hostname) host.hostname = hostname;
    if (ipAddress) host.ipAddress = ipAddress;
    if (operatingSystem) host.operatingSystem = operatingSystem;
    if (status) host.status = status.toUpperCase();
    if (lastScanned) host.lastScanned = lastScanned;

    host.updatedAt = new Date();
    await host.save();
    res.json(host);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE host
export const deleteHost = async (req, res) => {
  try {
    const host = await Host.findByIdAndDelete(req.params.id);
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    res.json({ message: 'Host deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET host statistics
export const getHostStats = async (req, res) => {
  try {
    const total = await Host.countDocuments();
    const active = await Host.countDocuments({ status: 'ACTIVE' });
    const inactive = await Host.countDocuments({ status: 'INACTIVE' });
    const maintenance = await Host.countDocuments({ status: 'MAINTENANCE' });

    const stats = {
      total,
      active,
      inactive,
      maintenance,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
