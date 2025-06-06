-- Sample system item types (standard types available to all organizations)
-- These will have org_id = NULL and is_custom = false

INSERT INTO item_types (name, description, category, icon, is_custom, org_id) VALUES
-- Electronics
('Laptop', 'Portable computer for office and remote work', 'Electronics', 'package', false, null),
('Desktop Computer', 'Stationary computer workstation', 'Electronics', 'package', false, null),
('Monitor', 'Display screen for computers', 'Electronics', 'package', false, null),
('Printer', 'Document printing device', 'Electronics', 'package', false, null),
('Scanner', 'Document scanning device', 'Electronics', 'package', false, null),
('Projector', 'Display projection device for presentations', 'Electronics', 'package', false, null),
('Tablet', 'Portable touchscreen device', 'Electronics', 'package', false, null),
('Smartphone', 'Mobile communication device', 'Electronics', 'package', false, null),
('Router', 'Network routing device', 'Electronics', 'settings', false, null),
('Switch', 'Network switching device', 'Electronics', 'settings', false, null),
('Camera', 'Photo and video recording device', 'Electronics', 'package', false, null),
('Microphone', 'Audio recording device', 'Electronics', 'package', false, null),
('Speakers', 'Audio output device', 'Electronics', 'package', false, null),
('Headphones', 'Personal audio device', 'Electronics', 'package', false, null),

-- Furniture
('Desk', 'Work surface furniture', 'Furniture', 'package', false, null),
('Chair', 'Seating furniture', 'Furniture', 'package', false, null),
('Cabinet', 'Storage furniture', 'Furniture', 'package', false, null),
('Bookshelf', 'Book storage furniture', 'Furniture', 'package', false, null),
('Table', 'Meeting or dining table', 'Furniture', 'package', false, null),
('Whiteboard', 'Writing and presentation board', 'Furniture', 'package', false, null),
('Filing Cabinet', 'Document storage cabinet', 'Furniture', 'package', false, null),
('Locker', 'Personal storage unit', 'Furniture', 'package', false, null),

-- Vehicles
('Car', 'Passenger vehicle', 'Vehicles', 'package', false, null),
('Truck', 'Cargo vehicle', 'Vehicles', 'package', false, null),
('Van', 'Multi-purpose vehicle', 'Vehicles', 'package', false, null),
('Motorcycle', 'Two-wheeled vehicle', 'Vehicles', 'package', false, null),
('Bicycle', 'Human-powered vehicle', 'Vehicles', 'package', false, null),
('Forklift', 'Material handling vehicle', 'Vehicles', 'package', false, null),

-- Tools
('Drill', 'Power drilling tool', 'Tools', 'settings', false, null),
('Hammer', 'Manual striking tool', 'Tools', 'settings', false, null),
('Screwdriver', 'Screw turning tool', 'Tools', 'settings', false, null),
('Wrench', 'Bolt turning tool', 'Tools', 'settings', false, null),
('Saw', 'Cutting tool', 'Tools', 'settings', false, null),
('Measuring Tape', 'Distance measuring tool', 'Tools', 'settings', false, null),
('Level', 'Surface alignment tool', 'Tools', 'settings', false, null),
('Ladder', 'Climbing equipment', 'Tools', 'settings', false, null),

-- Safety Equipment
('Fire Extinguisher', 'Fire suppression device', 'Safety', 'star', false, null),
('First Aid Kit', 'Medical emergency supplies', 'Safety', 'star', false, null),
('Safety Helmet', 'Head protection equipment', 'Safety', 'star', false, null),
('Safety Vest', 'High visibility clothing', 'Safety', 'star', false, null),
('Eye Protection', 'Eye safety equipment', 'Safety', 'star', false, null),
('Gloves', 'Hand protection equipment', 'Safety', 'star', false, null),
('Emergency Light', 'Emergency illumination device', 'Safety', 'star', false, null),

-- Appliances
('Refrigerator', 'Food cooling appliance', 'Appliances', 'package', false, null),
('Microwave', 'Food heating appliance', 'Appliances', 'package', false, null),
('Coffee Machine', 'Beverage preparation appliance', 'Appliances', 'package', false, null),
('Water Cooler', 'Water dispensing appliance', 'Appliances', 'package', false, null),
('Air Conditioner', 'Climate control appliance', 'Appliances', 'settings', false, null),
('Heater', 'Heating appliance', 'Appliances', 'settings', false, null),
('Dishwasher', 'Dish cleaning appliance', 'Appliances', 'package', false, null),

-- Medical Equipment
('Stethoscope', 'Medical examination tool', 'Medical', 'star', false, null),
('Blood Pressure Monitor', 'Blood pressure measurement device', 'Medical', 'star', false, null),
('Thermometer', 'Temperature measurement device', 'Medical', 'star', false, null),
('Wheelchair', 'Mobility assistance device', 'Medical', 'package', false, null),
('Hospital Bed', 'Medical bed for patients', 'Medical', 'package', false, null),
('Defibrillator', 'Emergency cardiac device', 'Medical', 'star', false, null),

-- Manufacturing Equipment
('Conveyor Belt', 'Material transport system', 'Manufacturing', 'settings', false, null),
('Industrial Robot', 'Automated manufacturing device', 'Manufacturing', 'settings', false, null),
('Press Machine', 'Material forming machine', 'Manufacturing', 'settings', false, null),
('Welder', 'Metal joining equipment', 'Manufacturing', 'settings', false, null),
('Compressor', 'Air compression equipment', 'Manufacturing', 'settings', false, null),
('Generator', 'Electrical power generation equipment', 'Manufacturing', 'settings', false, null),

-- Cleaning Equipment
('Vacuum Cleaner', 'Floor cleaning device', 'Cleaning', 'package', false, null),
('Mop', 'Floor cleaning tool', 'Cleaning', 'package', false, null),
('Cleaning Cart', 'Cleaning supply transport', 'Cleaning', 'package', false, null),
('Pressure Washer', 'High-pressure cleaning device', 'Cleaning', 'package', false, null),
('Floor Buffer', 'Floor polishing machine', 'Cleaning', 'package', false, null),

-- Software/Licenses
('Software License', 'Software usage license', 'Software', 'tag', false, null),
('Operating System', 'Computer operating system', 'Software', 'tag', false, null),
('Antivirus Software', 'Security software', 'Software', 'tag', false, null),
('Office Suite', 'Productivity software package', 'Software', 'tag', false, null),
('Database Software', 'Data management software', 'Software', 'tag', false, null),
('Design Software', 'Creative design software', 'Software', 'tag', false, null); 