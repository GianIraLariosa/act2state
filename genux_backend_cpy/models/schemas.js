const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    password: { type: String },
    entryDate: { type: Date, default: Date.now }
});

const wireframeSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
    script: { type: String, required: true },
    title: { type: String, required: true } 
  });
  

const activityDiagramSchema= new Schema ({
    user_id: { type: Schema.Types.ObjectId, ref: 'Users' }, 
    bpmn: { type: String, text: true },
    name: { type: String, text: true}
});

const Users = mongoose.model('Users', userSchema, 'User');
const Wireframe = mongoose.model('Wireframe', wireframeSchema, 'Wireframe');
const Activity_Diagram = mongoose.model('Activity_Diagram', activityDiagramSchema, 'Activity_Diagram');
const mySchemas = {
    'Users': Users,
    'Wireframe': Wireframe,
    'Activity_Diagram': Activity_Diagram
};

module.exports = mySchemas;
