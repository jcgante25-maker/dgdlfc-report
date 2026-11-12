const db = require('../config/database');

const Report = {
  // Method to save a new report to the database
  create: (data, callback) => {
    const sql = `INSERT INTO reports 
      (tracking_code, description, incident_date, location, bullying_type, is_anonymous, contact_info, image_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
      data.tracking_code, 
      data.description, 
      data.incident_date, 
      data.location, 
      data.bullying_type, 
      data.is_anonymous, 
      data.contact_info, 
      data.image_path
    ], function(err) {
      callback(err, this.lastID);
    });
  },

  // Method to find a report by its unique tracking code
  findByCode: (code, callback) => {
    db.get('SELECT * FROM reports WHERE tracking_code = ?', [code], callback);
  }
};

module.exports = Report;