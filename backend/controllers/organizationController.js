import Organization from '../models/Organization.js';

// GET all organizations
export const getOrganizations = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) query.status = status.toUpperCase();

    const organizations = await Organization.find(query);
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single organization
export const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE organization
export const createOrganization = async (req, res) => {
  try {
    const { name, description, industry, size, contactEmail, managerId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newOrg = new Organization({
      name,
      description: description || '',
      industry: industry || 'Unknown',
      size: size || 'SMB',
      contactEmail: contactEmail || '',
      managerId: managerId || null,
      status: 'ACTIVE',
      perimeters: [],
    });

    await newOrg.save();
    res.status(201).json(newOrg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE organization
export const updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { name, description, industry, size, contactEmail, status, managerId } = req.body;
    if (name) org.name = name;
    if (description) org.description = description;
    if (industry) org.industry = industry;
    if (size) org.size = size;
    if (contactEmail) org.contactEmail = contactEmail;
    if (status) org.status = status.toUpperCase();
    if (managerId) org.managerId = managerId;

    org.updatedAt = new Date();
    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE organization
export const deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD perimeter to organization
export const addPerimeter = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { perimeter } = req.body;
    if (!perimeter) {
      return res.status(400).json({ error: 'Perimeter required' });
    }

    if (!org.perimeters.includes(perimeter)) {
      org.perimeters.push(perimeter);
    }

    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REMOVE perimeter from organization
export const removePerimeter = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { perimeter } = req.body;
    org.perimeters = org.perimeters.filter(p => p !== perimeter);

    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
