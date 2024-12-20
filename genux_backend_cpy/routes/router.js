const express = require('express');
const axios = require('axios');
const router = express.Router();
const schemas = require('../models/schemas');
var plantumlEncoder = require('plantuml-encoder');

router.post('/registration', async (req, res) => {
    const { firstname, lastname, username, password } = req.body;
    try {
        const newUser = new schemas.Users({
            firstName: firstname,
            lastName: lastname,
            username: username,
            password: password
        });

        const savedUser = await newUser.save();
        console.log(`${firstname} ${lastname} registered.`);
        res.status(201).send('Registered User Successfully');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await schemas.Users.findOne({ username: username, password: password });
        if (user) {
            res.send({ id: user._id, ...user._doc }); 
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await schemas.Users.find();
        res.send(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

router.post('/wireframe', async (req, res) => {
    const { user_id, script, title} = req.body; 
    try {
        const newWireframe = new schemas.Wireframe({
            user_id: user_id,
            script: script,
            title: title
        });

        const savedWireframe = await newWireframe.save();
        res.status(201).send('Wireframe created successfully');
    } catch (error) {
        console.error('Error creating wireframe:', error);
        res.status(500).send('Error creating wireframe');
    }
});

router.post('/save-diagram', async (req, res) => {
    const { userId, name, bpmn } = req.body;

    try {
        // Try to find and update an existing diagram
        const updatedDiagram = await schemas.Activity_Diagram.findOneAndUpdate(
            { user_id: userId, name: name },  // Query to find by userId and name
            { $set: { bpmn: bpmn } },         // Only update the BPMN field
            { new: true }                     // Return the updated document
        );

        if (updatedDiagram) {
            res.status(200).send('Diagram updated successfully');
        } else {
            // If no diagram was found, create a new one
            const newDiagram = new schemas.Activity_Diagram({
                user_id: userId,
                name: name,
                bpmn: bpmn
            });

            await newDiagram.save();
            res.status(201).send('New diagram saved successfully');
        }
    } catch (error) {
        console.error('Error saving/updating diagram:', error);
        res.status(500).send('Error saving/updating diagram');
    }
});

// Function to encode PlantUML script
function encodePlantUML(uml) {
    const deflated = pako.deflate(uml, { level: 9 });
    return Buffer.from(deflated)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// router.post('/api/generate-plantuml', async (req, res) => {
//     const { script } = req.body;

//     try {
//         const krokiUrl = 'https://kroki.io/plantuml/png';
//         const response = await axios.post(krokiUrl, script, {
//             headers: {
//                 'Content-Type': 'text/plain'
//             },
//             responseType: 'arraybuffer'
//         });

//         const imageUrl = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
//         res.json({ imageUrl });
//     } catch (error) {
//         console.error("Error generating PlantUML image with Kroki:", error);
//         res.status(500).json({ error: 'Failed to generate PlantUML image.' });
//     }
// });

// Function to encode PlantUML script
function encodePlantUML(uml) {
    // Deflate compression (without zlib headers)
    const compressed = zlib.deflateRawSync(uml);

    // Base64 encoding with URL-safe replacements
    return compressed.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove padding '='
}

router.post('/api/generate-plantuml', async (req, res) => {
    const { script } = req.body;

    try {
        // Encode the PlantUML script
        // const encodedScript = encodePlantUML(script);
        var encoded = plantumlEncoder.encode(script);

        // Build the URL for the PlantUML server
        const plantUmlUrl = `https://www.plantuml.com/plantuml/img/` + encoded;

        // Make a GET request to the PlantUML server
        const response = await axios.get(plantUmlUrl, {
            responseType: 'arraybuffer' // Get image as binary data
        });

        // Convert the response to base64
        const imageUrl = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;

        res.json({ imageUrl });
    } catch (error) {
        console.error("Error generating PlantUML image:", error);
        res.status(500).json({ error: 'Failed to generate PlantUML image.' });
    }
});


router.get('/diagrams/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const diagrams = await schemas.Activity_Diagram.find({ user_id: user_id }, { name: 1, bpmn: 1,  _id: 0 }); 
        res.json(diagrams);
    } catch (error) {
        console.error('Error fetching diagrams:', error);
        res.status(500).send('Error fetching diagrams');
    }
});

router.get('/wireframes/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const wireframes = await schemas.Wireframe.find({ user_id: user_id }, { title: 1, script: 1, _id: 0 });

        if (wireframes.length > 0) {
            res.json(wireframes); 
        } else {
            res.status(404).send('No wireframes found for this user');
        }
    } catch (error) {
        console.error('Error fetching wireframes:', error);
        res.status(500).send('Error fetching wireframes');
    }
});

router.delete('/diagrams/:user_id/:name', async (req, res) => {
    const { user_id, name } = req.params;
    try {
        const deletedDiagram = await schemas.Activity_Diagram.findOneAndDelete({
            user_id: user_id,
            name: name
        });

        if (deletedDiagram) {
            res.status(200).send('Diagram deleted successfully');
        } else {
            res.status(404).send('Diagram not found');
        }
    } catch (error) {
        console.error('Error deleting diagram:', error);
        res.status(500).send('Error deleting diagram');
    }
});

router.delete('/wireframes/:user_id/:title', async (req, res) => {
    const { user_id, title } = req.params;
    try {
        const deletedWireframe = await schemas.Wireframe.findOneAndDelete({
            user_id: user_id,
            title: title
        });

        if (deletedWireframe) {
            res.status(200).send('Wireframe deleted successfully');
        } else {
            res.status(404).send('Wireframe not found');
        }
    } catch (error) {
        console.error('Error deleting wireframe:', error);
        res.status(500).send('Error deleting wireframe');
    }
});

module.exports = router;
