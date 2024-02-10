//To Retreive Single Token
const { Token } = require("../models/tokModel");
const { Doc } = require("../models/docModel");
const { Pats } = require("../models/patModel");

const retrieveSingleToken = async (req, res) => {
  try {
    const tokenValue = parseInt(req.body.id);
    const result = await Token.aggregate([
      { $match: { "tokens.token": tokenValue } },
    ]);
    const results = result[0].tokens;
    let results1 = results.find((data) => data.token === parseInt(req.body.id));
    // return res.status(200).send({data:results1})
    const docsDetails = await Doc.findById(results1.docs);
    const patientDetails = await Pats.findById(results1.patient);
    // console.log(patientDetails)
    if (!docsDetails || !patientDetails) {
      return res
        .status(404)
        .json({ message: "Docs or Patient details not found" });
    }
    const prescriptions = patientDetails.docConsult.map(
      (entry) => entry.prescription
    );
    let doctorNames = [];
    await Pats.findById(patientDetails._id)
      .populate("docConsult.doctor") // Populate the doctor field in docConsult array
      .exec()
      .then((patient) => {
        // Extract doctor names from docConsult array
        doctorNames = patient.docConsult.map(
          (consult) => consult.doctor.name
        );
      })
      .catch((err) => {
        console.error(err);
        // Handle the error
      });
      const combinedData = prescriptions.map((prescription, index) => ({
        prescription,
        doctorName: doctorNames[index],
      }));
    const responseData = {
      data: {
        token: results1.token,
        docs: {
          _id: docsDetails._id,
          name: docsDetails.name,
          age: docsDetails.age,
        },
        patient: {
          _id: patientDetails._id,
          name: patientDetails.name,
          age: patientDetails.age,
          phno: patientDetails.phno,
          combinedData
        },
        createdAt: results1.createdAt,
      },
    };

    return res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: "Server Error: " + err });
  }
};

module.exports = { retrieveSingleToken };