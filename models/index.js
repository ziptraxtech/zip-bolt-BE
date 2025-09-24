const User = require('./User');
const Organization = require('./Organization');
const SubscriptionPlan = require('./SubscriptionPlan');
const Subscription = require('./Subscription');
const Vehicle = require('./Vehicle');
const Job = require('./Job');
const Payment = require('./Payment');
const JobLog = require('./JobLog');
const Charger = require("./Charger");

// User - Organization relationship
User.belongsTo(Organization, { 
  foreignKey: 'organizationId', 
  as: 'organization' 
});
Organization.hasMany(User, { 
  foreignKey: 'organizationId', 
  as: 'users' 
});

// User - Job relationships (as allocator and rider)
User.hasMany(Job, { 
  foreignKey: 'allocatorId', 
  as: 'allocatedJobs' 
});
User.hasMany(Job, { 
  foreignKey: 'riderId', 
  as: 'assignedJobs' 
});
Job.belongsTo(User, { 
  foreignKey: 'allocatorId', 
  as: 'allocator' 
});
Job.belongsTo(User, { 
  foreignKey: 'riderId', 
  as: 'rider' 
});

// Organization - Vehicle relationship
Organization.hasMany(Vehicle, { 
  foreignKey: 'organizationId', 
  as: 'vehicles' 
});
Vehicle.belongsTo(Organization, { 
  foreignKey: 'organizationId', 
  as: 'organization' 
});

// Organization - Job relationship
Organization.hasMany(Job, { 
  foreignKey: 'organizationId', 
  as: 'jobs' 
});
Job.belongsTo(Organization, { 
  foreignKey: 'organizationId', 
  as: 'organization' 
});

// Vehicle - Job relationship
Vehicle.hasMany(Job, { 
  foreignKey: 'vehicleId', 
  as: 'jobs' 
});
Job.belongsTo(Vehicle, { 
  foreignKey: 'vehicleId', 
  as: 'vehicle' 
});

// Organization - Subscription relationship
Organization.hasMany(Subscription, { 
  foreignKey: 'organizationId', 
  as: 'subscriptions' 
});
Subscription.belongsTo(Organization, { 
  foreignKey: 'organizationId', 
  as: 'organization' 
});

// SubscriptionPlan - Subscription relationship
SubscriptionPlan.hasMany(Subscription, { 
  foreignKey: 'planId', 
  as: 'subscriptions' 
});
Subscription.belongsTo(SubscriptionPlan, { 
  foreignKey: 'planId', 
  as: 'plan' 
});

// Subscription - Payment relationship
Subscription.hasMany(Payment, { 
  foreignKey: 'subscriptionId', 
  as: 'payments' 
});
Payment.belongsTo(Subscription, { 
  foreignKey: 'subscriptionId', 
  as: 'subscription' 
});

// Job - JobLog relationship
Job.hasMany(JobLog, { 
  foreignKey: 'jobId', 
  as: 'logs' 
});
JobLog.belongsTo(Job, { 
  foreignKey: 'jobId', 
  as: 'job' 
});

// User - JobLog relationship
User.hasMany(JobLog, { 
  foreignKey: 'userId', 
  as: 'jobLogs' 
});
JobLog.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

module.exports = {
  User,
  Organization,
  SubscriptionPlan,
  Subscription,
  Vehicle,
  Job,
  Payment,
  JobLog,
  Charger
}; 