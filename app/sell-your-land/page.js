"use client";

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { supabase } from '../../lib/supabase';

// Email validation - checks format and blocks fake/disposable domains
const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required' };

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  const domain = email.split('@')[1].toLowerCase();

  // Block disposable/temporary email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
    'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com',
    'yopmail.com', 'sharklasers.com', 'getnada.com', 'tempail.com',
    'emailondeck.com', 'mohmal.com', 'dispostable.com', 'maildrop.cc',
    'getairmail.com', 'temp-mail.io', 'burnermail.io', 'spamgourmet.com'
  ];

  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Please use a permanent email address' };
  }

  // Check for obviously fake domains (no dot, too short, etc.)
  const domainParts = domain.split('.');
  if (domainParts.length < 2 || domainParts[0].length < 2 || domainParts[domainParts.length - 1].length < 2) {
    return { valid: false, error: 'Please enter a valid email domain' };
  }

  return { valid: true, error: null };
};

export default function SellYourLandPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formFocused, setFormFocused] = useState(false);
  const [showDisqualifiedModal, setShowDisqualifiedModal] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    homeOnProperty: '',
    propertyListed: '',
    isInherited: '',
    ownedFourYears: '',
    whySelling: '',
    propertyState: '',
    streetAddress: '',
    propertyCounty: '',
    acres: '',
    fullName: '',
    namesOnDeed: '',
    email: '',
    phone: '',
    smsConsent: false
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [e164Phone, setE164Phone] = useState('');
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [countySuggestions, setCountySuggestions] = useState([]);
  const [showCountySuggestions, setShowCountySuggestions] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Direct link to step: ?step=14
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step) {
      setCurrentStep(parseInt(step, 10));
      setFormFocused(true);
    }
  }, []);

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const handleStateChange = (value) => {
    setFormData({...formData, propertyState: value});
    if (value.length > 0) {
      const filtered = US_STATES.filter(state =>
        state.toLowerCase().startsWith(value.toLowerCase())
      );
      setStateSuggestions(filtered);
      setShowStateSuggestions(filtered.length > 0);
    } else {
      setStateSuggestions([]);
      setShowStateSuggestions(false);
    }
  };

  const selectState = (state) => {
    setFormData({...formData, propertyState: state, propertyCounty: ''});
    setShowStateSuggestions(false);
  };

  // County data by state (major counties)
  const COUNTIES_BY_STATE = {
    'Texas': ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Hidalgo', 'El Paso', 'Denton', 'Fort Bend', 'Montgomery', 'Williamson', 'Cameron', 'Nueces', 'Bell', 'Brazoria', 'Galveston', 'Lubbock', 'Webb', 'Jefferson', 'McLennan', 'Smith', 'Brazos', 'Hays', 'Ellis', 'Midland', 'Johnson', 'Ector', 'Guadalupe', 'Potter', 'Randall', 'Taylor', 'Kaufman', 'Rockwall', 'Parker', 'Grayson', 'Comal', 'Tom Green', 'Wichita', 'Hunt', 'Bastrop', 'Victoria', 'Gregg', 'Henderson', 'Cherokee', 'Nacogdoches', 'Angelina', 'Liberty', 'Orange', 'Bowie'],
    'Tennessee': ['Shelby', 'Davidson', 'Knox', 'Hamilton', 'Rutherford', 'Williamson', 'Sumner', 'Montgomery', 'Wilson', 'Blount', 'Sevier', 'Washington', 'Maury', 'Madison', 'Sullivan', 'Bradley', 'Putnam', 'Anderson', 'Robertson', 'Carter', 'Bedford', 'Coffee', 'Greene', 'Tipton', 'Hamblen', 'Loudon', 'Dickson', 'Roane', 'Cumberland', 'McMinn', 'Obion', 'Hawkins', 'Gibson', 'Cheatham', 'Monroe', 'Weakley', 'Dyer', 'Warren', 'Jefferson', 'Lawrence'],
    'Florida': ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange', 'Pinellas', 'Duval', 'Lee', 'Polk', 'Brevard', 'Volusia', 'Pasco', 'Seminole', 'Sarasota', 'Manatee', 'Collier', 'Marion', 'Lake', 'Osceola', 'Escambia', 'St. Johns', 'St. Lucie', 'Leon', 'Alachua', 'Clay', 'Hernando', 'Okaloosa', 'Charlotte', 'Bay', 'Santa Rosa', 'Martin', 'Indian River', 'Citrus', 'Flagler', 'Sumter', 'Nassau', 'Highlands', 'Putnam', 'Columbia', 'Walton'],
    'Georgia': ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Chatham', 'Cherokee', 'Clayton', 'Forsyth', 'Henry', 'Richmond', 'Hall', 'Muscogee', 'Houston', 'Douglas', 'Paulding', 'Bibb', 'Columbia', 'Carroll', 'Coweta', 'Lowndes', 'Bartow', 'Floyd', 'Fayette', 'Newton', 'Clarke', 'Whitfield', 'Troup', 'Glynn', 'Rockdale', 'Bulloch', 'Dougherty', 'Thomas', 'Walton', 'Barrow', 'Gordon', 'Spalding', 'Catoosa', 'Liberty', 'Walker', 'Effingham'],
    'North Carolina': ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Buncombe', 'Union', 'Gaston', 'New Hanover', 'Cabarrus', 'Johnston', 'Onslow', 'Pitt', 'Davidson', 'Alamance', 'Randolph', 'Rowan', 'Catawba', 'Iredell', 'Robeson', 'Wayne', 'Brunswick', 'Henderson', 'Nash', 'Cleveland', 'Moore', 'Craven', 'Harnett', 'Orange', 'Burke', 'Caldwell', 'Lincoln', 'Wilson', 'Surry', 'Rockingham', 'Carteret', 'Stanly', 'Lenoir', 'Lee'],
    'South Carolina': ['Greenville', 'Richland', 'Charleston', 'Horry', 'Spartanburg', 'Lexington', 'York', 'Anderson', 'Berkeley', 'Dorchester', 'Beaufort', 'Aiken', 'Florence', 'Pickens', 'Sumter', 'Lancaster', 'Orangeburg', 'Laurens', 'Georgetown', 'Oconee', 'Kershaw', 'Darlington', 'Cherokee', 'Newberry', 'Colleton', 'Clarendon', 'Williamsburg', 'Marion', 'Chesterfield', 'Union'],
    'Alabama': ['Jefferson', 'Mobile', 'Madison', 'Montgomery', 'Baldwin', 'Tuscaloosa', 'Shelby', 'Morgan', 'Lee', 'Calhoun', 'Houston', 'Etowah', 'Limestone', 'Marshall', 'Lauderdale', 'St. Clair', 'Elmore', 'Talladega', 'Russell', 'Walker', 'Cullman', 'Autauga', 'Coffee', 'Dale', 'Blount', 'DeKalb', 'Chilton', 'Chambers', 'Tallapoosa', 'Colbert'],
    'Mississippi': ['Hinds', 'Harrison', 'DeSoto', 'Rankin', 'Jackson', 'Madison', 'Lee', 'Forrest', 'Lauderdale', 'Lowndes', 'Jones', 'Pearl River', 'Lamar', 'Washington', 'Warren', 'Lafayette', 'Hancock', 'Lincoln', 'Pike', 'Oktibbeha', 'Monroe', 'Pontotoc', 'Alcorn', 'Adams', 'Simpson', 'Bolivar', 'Leflore', 'Scott', 'Panola', 'Copiah'],
    'Louisiana': ['East Baton Rouge', 'Jefferson', 'Orleans', 'St. Tammany', 'Lafayette', 'Caddo', 'Calcasieu', 'Ouachita', 'Livingston', 'Tangipahoa', 'Rapides', 'Bossier', 'Ascension', 'Terrebonne', 'St. Landry', 'Lafourche', 'St. Charles', 'Iberia', 'St. John the Baptist', 'Vermilion', 'Acadia', 'Natchitoches', 'St. Martin', 'St. Mary', 'Lincoln', 'Webster', 'Beauregard', 'Washington', 'Allen', 'Evangeline'],
    'Arkansas': ['Pulaski', 'Benton', 'Washington', 'Sebastian', 'Faulkner', 'Saline', 'Craighead', 'Garland', 'White', 'Jefferson', 'Lonoke', 'Pope', 'Crawford', 'Crittenden', 'Mississippi', 'Miller', 'Greene', 'Baxter', 'Hot Spring', 'Independence', 'Union', 'Cleburne', 'Boone', 'Carroll', 'St. Francis', 'Columbia', 'Hempstead', 'Clark', 'Cross', 'Sharp'],
    'Oklahoma': ['Oklahoma', 'Tulsa', 'Cleveland', 'Canadian', 'Comanche', 'Rogers', 'Payne', 'Wagoner', 'Creek', 'Muskogee', 'Garfield', 'Pottawatomie', 'McClain', 'Grady', 'Cherokee', 'Carter', 'Kay', 'Osage', 'Bryan', 'Stephens', 'Le Flore', 'Pontotoc', 'Pittsburg', 'Okmulgee', 'Delaware', 'Mayes', 'Washington', 'Sequoyah', 'Logan', 'Jackson'],
    'Missouri': ['St. Louis', 'Jackson', 'St. Charles', 'Greene', 'Clay', 'St. Louis City', 'Jefferson', 'Boone', 'Jasper', 'Cass', 'Franklin', 'Buchanan', 'Cole', 'Platte', 'Christian', 'Cape Girardeau', 'Lincoln', 'Johnson', 'Newton', 'Taney', 'Phelps', 'Warren', 'Scott', 'Butler', 'Callaway', 'Stoddard', 'Dunklin', 'Pemiscot', 'New Madrid', 'Mississippi'],
    'Arizona': ['Maricopa', 'Pima', 'Pinal', 'Yavapai', 'Yuma', 'Mohave', 'Coconino', 'Cochise', 'Navajo', 'Apache', 'Gila', 'Santa Cruz', 'Graham', 'La Paz', 'Greenlee'],
    'Nevada': ['Clark', 'Washoe', 'Carson City', 'Douglas', 'Elko', 'Lyon', 'Nye', 'Churchill', 'Humboldt', 'White Pine', 'Pershing', 'Lander', 'Lincoln', 'Mineral', 'Eureka', 'Storey', 'Esmeralda'],
    'California': ['Los Angeles', 'San Diego', 'Orange', 'Riverside', 'San Bernardino', 'Santa Clara', 'Alameda', 'Sacramento', 'Contra Costa', 'Fresno', 'Kern', 'San Francisco', 'Ventura', 'San Mateo', 'San Joaquin', 'Stanislaus', 'Sonoma', 'Tulare', 'Santa Barbara', 'Solano', 'Monterey', 'Placer', 'San Luis Obispo', 'Santa Cruz', 'Merced', 'Marin', 'Butte', 'Yolo', 'El Dorado', 'Shasta'],
    'Colorado': ['Denver', 'El Paso', 'Arapahoe', 'Jefferson', 'Adams', 'Larimer', 'Douglas', 'Boulder', 'Weld', 'Pueblo', 'Mesa', 'Garfield', 'Broomfield', 'Eagle', 'La Plata', 'Fremont', 'Montrose', 'Summit', 'Routt', 'Delta', 'Pitkin', 'Gunnison', 'Park', 'Teller', 'Grand', 'Chaffee', 'Clear Creek', 'Gilpin', 'Lake', 'San Miguel'],
    'New Mexico': ['Bernalillo', 'Dona Ana', 'Santa Fe', 'Sandoval', 'San Juan', 'McKinley', 'Lea', 'Valencia', 'Chaves', 'Otero', 'Curry', 'Eddy', 'Rio Arriba', 'Cibola', 'Taos', 'Grant', 'Luna', 'Lincoln', 'Roosevelt', 'San Miguel', 'Socorro', 'Torrance', 'Sierra', 'Quay', 'Los Alamos', 'Colfax', 'Hidalgo', 'Guadalupe', 'Union', 'Mora'],
    'Ohio': ['Franklin', 'Cuyahoga', 'Hamilton', 'Summit', 'Montgomery', 'Lucas', 'Butler', 'Stark', 'Lorain', 'Warren', 'Lake', 'Clermont', 'Mahoning', 'Delaware', 'Medina', 'Licking', 'Trumbull', 'Allen', 'Portage', 'Wood', 'Richland', 'Fairfield', 'Wayne', 'Greene', 'Columbiana', 'Miami', 'Clark', 'Geauga', 'Tuscarawas', 'Ashtabula'],
    'Michigan': ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Genesee', 'Washtenaw', 'Ingham', 'Ottawa', 'Kalamazoo', 'Livingston', 'Saginaw', 'Muskegon', 'St. Clair', 'Jackson', 'Monroe', 'Berrien', 'Calhoun', 'Eaton', 'Bay', 'Allegan', 'Lenawee', 'Van Buren', 'Clinton', 'Lapeer', 'Shiawassee', 'Isabella', 'Midland', 'Tuscola', 'Barry', 'Newaygo'],
    'Indiana': ['Marion', 'Lake', 'Allen', 'Hamilton', 'St. Joseph', 'Elkhart', 'Tippecanoe', 'Vanderburgh', 'Porter', 'Hendricks', 'Johnson', 'Madison', 'Monroe', 'Clark', 'Vigo', 'Delaware', 'LaPorte', 'Floyd', 'Wayne', 'Bartholomew', 'Howard', 'Kosciusko', 'Grant', 'Warrick', 'Hancock', 'Morgan', 'Boone', 'Dearborn', 'Harrison', 'Jackson'],
    'Illinois': ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry', 'Winnebago', 'Madison', 'St. Clair', 'Champaign', 'Sangamon', 'Peoria', 'McLean', 'Rock Island', 'Tazewell', 'Kendall', 'LaSalle', 'Kankakee', 'DeKalb', 'Macon', 'Vermilion', 'Adams', 'Williamson', 'Jackson', 'Grundy', 'Coles', 'Knox', 'Whiteside', 'Ogle', 'Woodford'],
    'Wisconsin': ['Milwaukee', 'Dane', 'Waukesha', 'Brown', 'Racine', 'Outagamie', 'Winnebago', 'Kenosha', 'Rock', 'Marathon', 'Washington', 'La Crosse', 'Sheboygan', 'Eau Claire', 'Walworth', 'Fond du Lac', 'Dodge', 'Ozaukee', 'St. Croix', 'Jefferson', 'Manitowoc', 'Portage', 'Wood', 'Calumet', 'Sauk', 'Chippewa', 'Grant', 'Columbia', 'Dunn', 'Barron'],
    'Minnesota': ['Hennepin', 'Ramsey', 'Dakota', 'Anoka', 'Washington', 'St. Louis', 'Olmsted', 'Stearns', 'Scott', 'Wright', 'Carver', 'Blue Earth', 'Rice', 'Clay', 'Sherburne', 'Otter Tail', 'Crow Wing', 'Winona', 'Morrison', 'Becker', 'Kandiyohi', 'Itasca', 'Douglas', 'Goodhue', 'Mower', 'Nicollet', 'Lyon', 'Beltrami', 'Freeborn', 'Carlton'],
    'Iowa': ['Polk', 'Linn', 'Scott', 'Johnson', 'Black Hawk', 'Woodbury', 'Dubuque', 'Story', 'Pottawattamie', 'Dallas', 'Warren', 'Clinton', 'Cerro Gordo', 'Muscatine', 'Marshall', 'Jasper', 'Webster', 'Wapello', 'Lee', 'Des Moines', 'Marion', 'Boone', 'Sioux', 'Buena Vista', 'Plymouth', 'Bremer', 'Carroll', 'Jones', 'Benton', 'Buchanan'],
    'Kansas': ['Johnson', 'Sedgwick', 'Shawnee', 'Douglas', 'Wyandotte', 'Leavenworth', 'Riley', 'Butler', 'Reno', 'Saline', 'Crawford', 'Ford', 'Finney', 'Lyon', 'Geary', 'Ellis', 'Harvey', 'Miami', 'Franklin', 'Cowley', 'Montgomery', 'Barton', 'McPherson', 'Sumner', 'Seward', 'Cherokee', 'Labette', 'Dickinson', 'Atchison', 'Pottawatomie'],
    'Nebraska': ['Douglas', 'Lancaster', 'Sarpy', 'Hall', 'Buffalo', 'Lincoln', 'Scotts Bluff', 'Madison', 'Dodge', 'Adams', 'Platte', 'Washington', 'Gage', 'Dawson', 'Saunders', 'Cass', 'Otoe', 'Red Willow', 'Box Butte', 'Seward', 'Keith', 'York', 'Kearney', 'Cuming', 'Colfax', 'Pierce', 'Wayne', 'Thurston', 'Phelps', 'Richardson'],
    'North Dakota': ['Cass', 'Burleigh', 'Grand Forks', 'Ward', 'Williams', 'Stark', 'Morton', 'Stutsman', 'Richland', 'Barnes', 'Walsh', 'Ramsey', 'McKenzie', 'Mountrail', 'Rolette', 'Pembina', 'McHenry', 'McLean', 'Traill', 'Mercer', 'Dunn', 'Bottineau', 'Benson', 'Pierce', 'Wells', 'Nelson', 'Dickey', 'LaMoure', 'Ransom', 'Sargent'],
    'South Dakota': ['Minnehaha', 'Pennington', 'Lincoln', 'Brown', 'Brookings', 'Codington', 'Meade', 'Lawrence', 'Yankton', 'Davison', 'Hughes', 'Beadle', 'Union', 'Clay', 'Lake', 'Roberts', 'Turner', 'Bon Homme', 'Moody', 'Grant', 'Walworth', 'Fall River', 'Butte', 'Charles Mix', 'Edmunds', 'Kingsbury', 'Day', 'Spink', 'Deuel', 'Marshall'],
    'Montana': ['Yellowstone', 'Missoula', 'Gallatin', 'Flathead', 'Cascade', 'Lewis and Clark', 'Ravalli', 'Silver Bow', 'Lake', 'Lincoln', 'Hill', 'Park', 'Glacier', 'Custer', 'Jefferson', 'Roosevelt', 'Fergus', 'Richland', 'Sanders', 'Dawson', 'Valley', 'Carbon', 'Stillwater', 'Madison', 'Beaverhead', 'Teton', 'Rosebud', 'Powell', 'Blaine', 'Big Horn'],
    'Wyoming': ['Laramie', 'Natrona', 'Campbell', 'Sweetwater', 'Fremont', 'Albany', 'Sheridan', 'Park', 'Teton', 'Uinta', 'Lincoln', 'Carbon', 'Goshen', 'Converse', 'Big Horn', 'Sublette', 'Platte', 'Johnson', 'Hot Springs', 'Washakie', 'Crook', 'Weston', 'Niobrara'],
    'Idaho': ['Ada', 'Canyon', 'Kootenai', 'Bonneville', 'Twin Falls', 'Bannock', 'Bingham', 'Madison', 'Nez Perce', 'Jefferson', 'Elmore', 'Blaine', 'Cassia', 'Minidoka', 'Payette', 'Gem', 'Latah', 'Shoshone', 'Boise', 'Boundary', 'Gooding', 'Jerome', 'Fremont', 'Teton', 'Power', 'Franklin', 'Caribou', 'Lincoln', 'Bear Lake', 'Clearwater'],
    'Utah': ['Salt Lake', 'Utah', 'Davis', 'Weber', 'Washington', 'Cache', 'Tooele', 'Box Elder', 'Iron', 'Summit', 'Uintah', 'Sanpete', 'Sevier', 'Carbon', 'Duchesne', 'Wasatch', 'Juab', 'Millard', 'Emery', 'Grand', 'Morgan', 'San Juan', 'Beaver', 'Rich', 'Garfield', 'Kane', 'Wayne', 'Piute', 'Daggett'],
    'Washington': ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston', 'Kitsap', 'Yakima', 'Whatcom', 'Benton', 'Skagit', 'Cowlitz', 'Island', 'Grant', 'Lewis', 'Franklin', 'Chelan', 'Clallam', 'Mason', 'Grays Harbor', 'Walla Walla', 'Douglas', 'Whitman', 'Stevens', 'Okanogan', 'Pacific', 'Jefferson', 'Kittitas', 'Adams', 'San Juan'],
    'Oregon': ['Multnomah', 'Washington', 'Clackamas', 'Lane', 'Marion', 'Jackson', 'Deschutes', 'Linn', 'Douglas', 'Yamhill', 'Benton', 'Josephine', 'Polk', 'Umatilla', 'Klamath', 'Columbia', 'Coos', 'Clatsop', 'Lincoln', 'Malheur', 'Tillamook', 'Curry', 'Union', 'Baker', 'Crook', 'Jefferson', 'Wasco', 'Hood River', 'Lake', 'Wallowa'],
    'Kentucky': ['Jefferson', 'Fayette', 'Kenton', 'Boone', 'Warren', 'Hardin', 'Daviess', 'Campbell', 'Madison', 'Bullitt', 'Christian', 'McCracken', 'Oldham', 'Pulaski', 'Pike', 'Laurel', 'Scott', 'Boyd', 'Nelson', 'Jessamine', 'Clark', 'Shelby', 'Hopkins', 'Whitley', 'Henderson', 'Floyd', 'Graves', 'Calloway', 'Franklin', 'Grant'],
    'West Virginia': ['Kanawha', 'Berkeley', 'Cabell', 'Monongalia', 'Wood', 'Raleigh', 'Putnam', 'Harrison', 'Marion', 'Mercer', 'Jefferson', 'Ohio', 'Fayette', 'Wayne', 'Logan', 'Greenbrier', 'Hancock', 'Jackson', 'Morgan', 'Hampshire', 'Marshall', 'Preston', 'Upshur', 'Mineral', 'Brooke', 'Wetzel', 'Lewis', 'McDowell', 'Randolph', 'Mason'],
    'Virginia': ['Fairfax', 'Prince William', 'Virginia Beach', 'Loudoun', 'Chesterfield', 'Henrico', 'Chesapeake', 'Norfolk', 'Arlington', 'Richmond', 'Newport News', 'Hampton', 'Alexandria', 'Stafford', 'Spotsylvania', 'Roanoke', 'Hanover', 'Frederick', 'Albemarle', 'James City', 'Bedford', 'Rockingham', 'Montgomery', 'Augusta', 'Fauquier', 'Washington', 'Campbell', 'Pittsylvania', 'York', 'Henry'],
    'Maryland': ['Montgomery', 'Prince Georges', 'Baltimore', 'Anne Arundel', 'Howard', 'Baltimore City', 'Frederick', 'Harford', 'Carroll', 'Charles', 'Washington', 'St. Marys', 'Wicomico', 'Cecil', 'Calvert', 'Allegany', 'Worcester', 'Queen Annes', 'Talbot', 'Dorchester', 'Caroline', 'Garrett', 'Somerset', 'Kent'],
    'Delaware': ['New Castle', 'Sussex', 'Kent'],
    'Pennsylvania': ['Philadelphia', 'Allegheny', 'Montgomery', 'Bucks', 'Delaware', 'Lancaster', 'Chester', 'York', 'Berks', 'Lehigh', 'Northampton', 'Luzerne', 'Westmoreland', 'Erie', 'Dauphin', 'Cumberland', 'Lackawanna', 'Washington', 'Butler', 'Monroe', 'Beaver', 'Centre', 'Cambria', 'Schuylkill', 'Fayette', 'Blair', 'Lycoming', 'Lebanon', 'Franklin', 'Mercer'],
    'New Jersey': ['Bergen', 'Middlesex', 'Essex', 'Hudson', 'Monmouth', 'Ocean', 'Union', 'Camden', 'Passaic', 'Morris', 'Burlington', 'Mercer', 'Somerset', 'Gloucester', 'Atlantic', 'Cumberland', 'Sussex', 'Hunterdon', 'Warren', 'Cape May', 'Salem'],
    'New York': ['Kings', 'Queens', 'New York', 'Suffolk', 'Bronx', 'Nassau', 'Westchester', 'Erie', 'Monroe', 'Richmond', 'Onondaga', 'Orange', 'Rockland', 'Albany', 'Dutchess', 'Saratoga', 'Oneida', 'Niagara', 'Broome', 'Rensselaer', 'Schenectady', 'Chautauqua', 'Oswego', 'Jefferson', 'Ulster', 'St. Lawrence', 'Cattaraugus', 'Steuben', 'Chemung', 'Tompkins'],
    'Connecticut': ['Fairfield', 'Hartford', 'New Haven', 'New London', 'Litchfield', 'Middlesex', 'Tolland', 'Windham'],
    'Rhode Island': ['Providence', 'Kent', 'Washington', 'Newport', 'Bristol'],
    'Massachusetts': ['Middlesex', 'Worcester', 'Essex', 'Suffolk', 'Norfolk', 'Bristol', 'Plymouth', 'Hampden', 'Barnstable', 'Hampshire', 'Berkshire', 'Franklin', 'Dukes', 'Nantucket'],
    'New Hampshire': ['Hillsborough', 'Rockingham', 'Merrimack', 'Strafford', 'Grafton', 'Cheshire', 'Belknap', 'Carroll', 'Sullivan', 'Coos'],
    'Vermont': ['Chittenden', 'Rutland', 'Washington', 'Windsor', 'Bennington', 'Franklin', 'Windham', 'Addison', 'Caledonia', 'Orange', 'Orleans', 'Lamoille', 'Grand Isle', 'Essex'],
    'Maine': ['Cumberland', 'York', 'Penobscot', 'Kennebec', 'Androscoggin', 'Aroostook', 'Oxford', 'Somerset', 'Hancock', 'Knox', 'Waldo', 'Lincoln', 'Sagadahoc', 'Franklin', 'Washington', 'Piscataquis'],
    'Hawaii': ['Honolulu', 'Hawaii', 'Maui', 'Kauai', 'Kalawao'],
    'Alaska': ['Anchorage', 'Fairbanks North Star', 'Matanuska-Susitna', 'Kenai Peninsula', 'Juneau', 'Bethel', 'Ketchikan Gateway', 'Kodiak Island', 'Nome', 'North Slope', 'Northwest Arctic', 'Sitka', 'Valdez-Cordova', 'Wade Hampton', 'Yukon-Koyukuk']
  };

  const handleCountyChange = (value) => {
    setFormData({...formData, propertyCounty: value});
    const stateCounties = COUNTIES_BY_STATE[formData.propertyState] || [];
    if (value.length > 0 && stateCounties.length > 0) {
      const filtered = stateCounties.filter(county =>
        county.toLowerCase().startsWith(value.toLowerCase())
      );
      setCountySuggestions(filtered);
      setShowCountySuggestions(filtered.length > 0);
    } else {
      setCountySuggestions([]);
      setShowCountySuggestions(false);
    }
  };

  const selectCounty = (county) => {
    setFormData({...formData, propertyCounty: county});
    setShowCountySuggestions(false);
  };

  // Lock body scroll when modal is open OR form is focused
  useEffect(() => {
    if (showDisqualifiedModal || formFocused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDisqualifiedModal, formFocused]);

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleNext = () => {
    // Check if user selected realtor or wholesaler on step 1
    if (currentStep === 1 && (formData.position === 'realtor' || formData.position === 'wholesaler')) {
      setShowDisqualifiedModal(true);
      return;
    }

    // Check if user selected 0-2 acres on step 2
    if (currentStep === 2 && formData.acres === '0-2 Acres') {
      setShowDisqualifiedModal(true);
      return;
    }

    // Check if user selected YES for home on property (Step 3)
    // BUT allow if they have 50+ acres
    if (currentStep === 3 && formData.homeOnProperty === 'yes') {
      const hasLargeAcreage = formData.acres === '50-100 Acres' || formData.acres === '100+ Acres';
      if (!hasLargeAcreage) {
        setShowDisqualifiedModal(true);
        return;
      }
    }

    // Check if user selected YES for property listed (Step 4)
    if (currentStep === 4 && formData.propertyListed === 'yes') {
      setShowDisqualifiedModal(true);
      return;
    }

    // If property is inherited (Step 5), skip the ownership length question (Step 6)
    if (currentStep === 5 && formData.isInherited === 'yes') {
      setCurrentStep(7); // Skip to why selling question
      window.scrollTo({ top: document.getElementById('contact-form')?.offsetTop - 100 || 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: document.getElementById('contact-form')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    // If on step 7 (why selling) and property was inherited, go back to step 5 (skip step 6)
    if (currentStep === 7 && formData.isInherited === 'yes') {
      setCurrentStep(5);
    } else {
      setCurrentStep(currentStep - 1);
    }
    window.scrollTo({ top: document.getElementById('contact-form')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  const handleFormFocus = () => {
    setFormFocused(true);
  };

  const sendOTP = async () => {
    setIsLoading(true);
    setOtpError('');

    // Convert formatted phone to E.164 format for Twilio
    const e164 = '+1' + formData.phone.replace(/\D/g, '');
    setE164Phone(e164);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setCurrentStep(15); // Move to OTP verification step
      } else {
        setOtpError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setOtpError('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone, code: otpCode })
      });

      const data = await response.json();

      if (data.verified) {
        setOtpVerified(true);
        setIsLoading(false);
        // Submit to GHL (this will handle redirect)
        await submitToGHL();
      } else {
        setOtpError('Invalid code. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setOtpError('Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const submitToGHL = async () => {
    console.log('🚀 Starting submitToGHL...');

    // Prepare data for GHL webhook
    const webhookData = {
      full_name: formData.fullName,
      firstName: formData.fullName ? formData.fullName.split(' ')[0] : '',
      lastName: formData.fullName ? formData.fullName.split(' ').slice(1).join(' ') : '',
      email: formData.email,
      phone: e164Phone,
      position: formData.position,
      home_on_property: formData.homeOnProperty,
      property_listed: formData.propertyListed,
      owned_four_years: formData.ownedFourYears,
      property_state: formData.propertyState,
      street_address: formData.streetAddress,
      property_county: formData.propertyCounty,
      acres: formData.acres,
      names_on_deed: formData.namesOnDeed,
      phone_verified: true,
      lead_source: 'Website - Sell Your Land Form',
      submitted_at: new Date().toISOString()
    };

    console.log('📦 Webhook data:', webhookData);

    try {
      // Get user's IP address
      let userIp = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch (ipError) {
        console.error('Could not fetch IP:', ipError);
      }

      // Submit to Parcel Reach (Supabase) first
      console.log('💾 Saving to Parcel Reach database...');
      const { error: supabaseError } = await supabase
        .from('leads')
        .insert([{
          name: formData.fullName,
          email: formData.email,
          phone: e164Phone,
          address: `${formData.streetAddress}, ${formData.propertyCounty}, ${formData.propertyState}`,
          county: formData.propertyCounty,
          state: formData.propertyState,
          acres: parseFloat(formData.acres) || null,
          status: 'new',
          source: 'Haven Ground - Sell Your Land Form',
          notes: `Position: ${formData.position}\nHome on property: ${formData.homeOnProperty}\nProperty listed: ${formData.propertyListed}\nInherited: ${formData.isInherited}\nOwned 4+ years: ${formData.ownedFourYears || 'N/A (inherited)'}\nWhy selling: ${formData.whySelling}\nNames on deed: ${formData.namesOnDeed}`,
          phone_verified: true,
          ip_address: userIp,
          form_data: {
            position: formData.position,
            homeOnProperty: formData.homeOnProperty,
            propertyListed: formData.propertyListed,
            isInherited: formData.isInherited,
            ownedFourYears: formData.ownedFourYears,
            whySelling: formData.whySelling,
            propertyState: formData.propertyState,
            streetAddress: formData.streetAddress,
            propertyCounty: formData.propertyCounty,
            acres: formData.acres,
            fullName: formData.fullName,
            namesOnDeed: formData.namesOnDeed,
            email: formData.email,
            phone: e164Phone
          }
        }]);

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        // Continue anyway - don't block GHL submission
      } else {
        console.log('✅ Saved to Parcel Reach');
      }

      // Submit to GHL webhook
      console.log('📡 Sending webhook to GHL...');
      const response = await fetch('https://services.leadconnectorhq.com/hooks/wLaNbf44RqmPNhV1IEev/webhook-trigger/32643373-57f4-47c1-9b89-c4ecf9143beb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      console.log('✅ Response status:', response.status);
      const responseData = await response.json();
      console.log('✅ Response data:', responseData);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('⏳ Waiting 1 second before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to thank you page
      // Qualified leads: no home + owned 4+ years + not listed = go to /thank-you (Google conversion fires)
      const isQualified = (
        formData.homeOnProperty === 'no' &&
        formData.ownedFourYears === 'yes' &&
        formData.propertyListed === 'no'
      );
      console.log('🎯 Redirecting to:', isQualified ? '/thank-you' : '/thank-you-dq');
      window.location.href = isQualified ? '/thank-you' : '/thank-you-dq';
    } catch (error) {
      console.error('❌ Webhook error:', error);
      // Still redirect even if webhook fails
      const isQualified = (
        formData.homeOnProperty === 'no' &&
        formData.ownedFourYears === 'yes' &&
        formData.propertyListed === 'no'
      );
      console.log('🎯 Redirecting anyway to:', isQualified ? '/thank-you' : '/thank-you-dq');
      window.location.href = isQualified ? '/thank-you' : '/thank-you-dq';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission is now handled by OTP verification
  };

  return (
    <div className="flex flex-col min-h-screen font-serif relative">
      {/* Darkened overlay when form is focused */}
      {formFocused && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setFormFocused(false)}
        ></div>
      )}

      {/* Disqualified Modal */}
      {showDisqualifiedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn my-8">
            <button
              onClick={() => setShowDisqualifiedModal(false)}
              className="absolute top-4 right-4 text-[#3A4045] hover:text-[#2F4F33] text-2xl"
            >
              ×
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#2F4F33] rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F5EFD9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-2xl font-serif font-bold text-[#2F4F33] mb-4">
                Thanks for Your Interest
              </h3>

              {/* Message for realtors/wholesalers */}
              {(formData.position === 'realtor' || formData.position === 'wholesaler') ? (
                <>
                  <p className="text-[#3A4045] mb-6 leading-relaxed">
                    We appreciate you reaching out. For professional inquiries, please send your potential deal information directly to our acquisitions team:
                  </p>

                  <div className="bg-[#F5EFD9] rounded-lg p-6 mb-6">
                    <div>
                      <p className="text-sm text-[#3A4045] mb-2">Email us at:</p>
                      <a href="mailto:acquisitions@havenground.com" className="text-lg font-semibold text-[#2F4F33] hover:underline">
                        acquisitions@havenground.com
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                /* Message for all other disqualifications (home on property, listed, small acreage) */
                <p className="text-[#3A4045] mb-6 leading-relaxed">
                  Our current investment criteria doesn't allow for further application at this time. We are here to help in any other way. Thank you.
                  <br /><br />
                  <span className="font-semibold text-[#2F4F33]">- Haven Team</span>
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDisqualifiedModal(false)}
                  className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-6 py-3 rounded-lg font-semibold hover:bg-[#F5EFD9] transition-colors duration-200"
                >
                  Exit Form
                </button>
                <a
                  href="/"
                  className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2e1c] transition-colors duration-200 text-center"
                >
                  Continue to Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img src="/images/Haven LOGO Use.png" alt="Haven Ground Logo" className="h-16 sm:h-20 md:h-24 w-auto hover:opacity-90 transition-opacity duration-300"/>
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a href="/properties" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] text-lg font-medium border-b-2 border-[#2F4F33] transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden relative z-20 p-2 rounded-md text-[#2F4F33] hover:text-[#7D6B58] hover:bg-[#D2C6B2] focus:outline-none focus:ring-2 focus:ring-[#7D6B58] transition-colors duration-200">
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
          <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F5EFD9] border-b border-[#D2C6B2] shadow-lg transform transition-all duration-300 ease-in-out origin-top ${mobileMenuOpen ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-2 opacity-0 scale-y-95 pointer-events-none'}`}>
            <div className="px-4 py-4 space-y-2">
              <a href="/properties" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] font-medium text-lg py-3 bg-[#D2C6B2] rounded-lg px-4 border-l-4 border-[#2F4F33]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#7D6B58]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-[#2F4F33] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2F4F33] to-[#1a2e1c] opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#F5EFD9] font-serif font-light mb-6 leading-tight">
              Ready to Sell Your Land?
            </h1>
            <p className="text-xl md:text-2xl text-[#D2C6B2] max-w-3xl mx-auto leading-relaxed mb-8">
              Whether life's thrown you a curveball or you're just ready to move on, we're here to help make it straightforward.
            </p>
            <a href="#contact-form" className="inline-block bg-[#D4A574] text-white px-10 py-4 text-lg font-bold hover:bg-[#C69A65] transition-all duration-300 shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 transform hover:scale-105 rounded-md border-2 border-[#E8B86D]">
              CLICK FOR MY OFFER
            </a>
          </div>
        </div>
      </div>

      {/* Trust Builders */}
      <div className="py-16 bg-gradient-to-br from-[#F5EFD9] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Why Landowners Choose Us</h2>
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto">
              We've been doing this long enough to know what works and what doesn't. Here's what sets us apart.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">We Know Land</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Mountain properties, working ranches, development tracts, commercial land. Simple closings and complicated ones with tax issues, title questions, or scattered family members who all need to sign. We've handled it all and know how to get deals closed.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">We Actually Close</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    No surprises at the closing table. No last-minute renegotiations. When we make an offer and you accept it, we follow through. Our reputation depends on it, and we've built that reputation one handshake at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">Straightforward Process</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We handle the paperwork, take care of closing costs, and work on your timeline. If you need time to move equipment or settle estate matters, we understand. This is your land and your decision.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-lg border-t-4 border-[#2F4F33] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#2F4F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-3">Respect for Your Legacy</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We know this land likely means something to you. Maybe it's been in your family. Maybe you built something here. We're not just buying dirt, we're continuing a story. That matters to us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Life Situations */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Whatever Your Reason</h2>
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto">
              Life happens. We've worked with landowners in all kinds of situations, and we understand that every story is different.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Estate Settlements</h3>
              <p className="text-[#3A4045] text-sm">Inherited land you don't need or can't maintain</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Relocation</h3>
              <p className="text-[#3A4045] text-sm">Moving and need to sell before you go</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Financial Changes</h3>
              <p className="text-[#3A4045] text-sm">Need to free up cash or reduce obligations</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Retirement Planning</h3>
              <p className="text-[#3A4045] text-sm">Simplifying assets as you plan ahead</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Property Challenges</h3>
              <p className="text-[#3A4045] text-sm">Tax burdens, maintenance, or access issues</p>
            </div>
            <div className="text-center p-6 bg-[#F5EFD9] rounded-lg hover:bg-[#D2C6B2] transition-colors duration-300">
              <h3 className="text-lg text-[#2F4F33] font-semibold mb-2">Just Ready to Sell</h3>
              <p className="text-[#3A4045] text-sm">Sometimes you're just ready to move on</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-lg text-[#3A4045] max-w-2xl mx-auto font-light italic">
              No matter your situation, we approach every conversation with respect and understanding. This is about helping you, not pushing a sale.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gradient-to-b from-[#F5EFD9] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Simple Process</h2>
            <p className="text-lg text-[#3A4045]">
              No games. No pressure. Just an honest process from start to finish.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-6 top-6 bottom-6 w-0.5 bg-[#D2C6B2]"></div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">1</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">Tell Us About Your Property</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Fill out the form below or give us a call. We'll ask about your land, your timeline, and what you're hoping to accomplish.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">2</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">We Do Our Homework</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We'll research your property, review surveys and access, understand the market, and figure out what it's truly worth. This takes a few days, not weeks.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">3</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">You Get a Fair Offer</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    We'll present our offer and explain how we got there. You take your time deciding. No pressure, no tactics. Accept it or don't.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#2F4F33] text-[#F5EFD9] flex items-center justify-center text-2xl font-bold shadow-lg z-10">4</div>
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 border-l-4 border-[#2F4F33]">
                  <h3 className="text-xl text-[#2F4F33] font-serif mb-2">We Handle Everything</h3>
                  <p className="text-[#3A4045] leading-relaxed">
                    Title work, surveys if needed, closing costs—we take care of it. You show up to closing, sign papers, and get paid. That's it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#2F4F33] font-serif font-light mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-[#3A4045]">
              Tell us about your property and we'll be in touch within 24 hours.
            </p>
          </div>

          {/* Beautiful 12-Step Form */}
          <form
            onSubmit={handleSubmit}
            onClick={handleFormFocus}
            className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl mx-auto transition-all duration-500 ${
              formFocused ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 scale-105 max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto' : ''
            }`}
          >
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[#2F4F33]">Step {currentStep} of 15</span>
                <span className="text-sm font-medium text-[#2F4F33]">{Math.round((currentStep / 13) * 100)}%</span>
              </div>
              <div className="w-full bg-[#D2C6B2] rounded-full h-2">
                <div
                  className="bg-[#2F4F33] h-2 rounded-full transition-all duration-500"
                  style={{width: `${(currentStep / 13) * 100}%`}}
                ></div>
              </div>
            </div>

            {/* Step 1: Position Qualifier */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What's your relationship to this property?
                </h3>

                <div className="grid gap-3">
                  {[
                    {value: 'sole-owner', label: 'Sole Owner'},
                    {value: 'co-owner', label: 'Co-Owner'},
                    {value: 'family-member', label: 'Family Member, POA, or Friend Assisting Sale'},
                    {value: 'realtor', label: 'Realtor'},
                    {value: 'wholesaler', label: 'Wholesaler'}
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, position: option.value})}
                      className={`w-full p-5 border-2 rounded-lg text-left transition-all transform hover:scale-102 ${
                        formData.position === option.value
                          ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                          : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045] hover:bg-[#F5EFD9]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.position === option.value ? 'border-[#2F4F33] bg-[#2F4F33]' : 'border-[#D2C6B2]'
                        }`}>
                          {formData.position === option.value && (
                            <div className="w-3 h-3 bg-[#F5EFD9] rounded-full"></div>
                          )}
                        </div>
                        <span className="text-lg">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.position}
                  className="w-full bg-[#D4A574] text-white px-8 py-4 sm:py-5 text-base sm:text-lg font-bold hover:bg-[#C69A65] transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-6 rounded-lg active:scale-95"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Acres */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  How many acres?
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    '0-2 Acres',
                    '2-5 Acres',
                    '5-10 Acres',
                    '10-20 Acres',
                    '20-50 Acres',
                    '50-100 Acres',
                    '100+ Acres'
                  ].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFormData({...formData, acres: range})}
                      className={`p-5 border-2 rounded-lg text-center transition-all transform hover:scale-102 ${
                        formData.acres === range
                          ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                          : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045] hover:bg-[#F5EFD9]/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.acres === range ? 'border-[#2F4F33] bg-[#2F4F33]' : 'border-[#D2C6B2]'
                        }`}>
                          {formData.acres === range && (
                            <div className="w-3 h-3 bg-[#F5EFD9] rounded-full"></div>
                          )}
                        </div>
                        <span className="text-base font-medium">{range}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300 rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.acres} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Home on Property */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Is there a home on the property?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, homeOnProperty: 'no'})}
                    className={`p-5 sm:p-6 border-2 rounded-lg text-center transition-all active:scale-95 ${
                      formData.homeOnProperty === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl font-bold">No</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, homeOnProperty: 'yes'})}
                    className={`p-5 sm:p-6 border-2 rounded-lg text-center transition-all active:scale-95 ${
                      formData.homeOnProperty === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl font-bold">Yes</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.homeOnProperty}
                    className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Property Listed */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Is the property currently listed with a realtor?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, propertyListed: 'no'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.propertyListed === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">No</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, propertyListed: 'yes'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.propertyListed === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">Yes</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.propertyListed} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Is Property Inherited */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Is the property inherited?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isInherited: 'yes'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.isInherited === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">Yes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isInherited: 'no'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.isInherited === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">No</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.isInherited} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Owned 4 Years (skipped if inherited) */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Have you owned the property for at least 4 years?
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, ownedFourYears: 'yes'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.ownedFourYears === 'yes'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">Yes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, ownedFourYears: 'no'})}
                    className={`p-6 border-2 rounded-lg text-center transition-all ${
                      formData.ownedFourYears === 'no'
                        ? 'border-[#2F4F33] bg-[#F5EFD9] text-[#2F4F33] font-semibold shadow-lg'
                        : 'border-[#D2C6B2] hover:border-[#2F4F33] text-[#3A4045]'
                    }`}
                  >
                    <span className="text-4xl font-bold">No</span>
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.ownedFourYears} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Why Selling */}
            {currentStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  In a few words, why are you looking to sell?
                </h3>
                <p className="text-sm text-[#7D6B58] -mt-4 mb-4">
                  We've bought hundreds of properties — we understand every situation. Feel free to be open and honest.
                </p>

                <textarea
                  name="whySelling"
                  value={formData.whySelling}
                  onChange={handleChange}
                  placeholder="Tell us a bit about your situation..."
                  rows={3}
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors resize-none"
                  autoFocus
                />
                <p className={`text-sm ${formData.whySelling.length >= 50 ? 'text-green-600' : 'text-[#7D6B58]'}`}>
                  {formData.whySelling.length}/50 characters minimum
                </p>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={formData.whySelling.length < 50} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Property State */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What state is the property located in?
                </h3>

                <div className="relative">
                  <input
                    type="text"
                    name="propertyState"
                    value={formData.propertyState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    onFocus={() => formData.propertyState && handleStateChange(formData.propertyState)}
                    onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                    placeholder="Start typing..."
                    className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    autoFocus
                    autoComplete="off"
                  />
                  {showStateSuggestions && stateSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#D2C6B2] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {stateSuggestions.map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => selectState(state)}
                          className="w-full px-6 py-3 text-left text-lg text-[#3A4045] hover:bg-[#F5EFD9] transition-colors border-b border-[#D2C6B2] last:border-b-0"
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.propertyState} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: County */}
            {currentStep === 9 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What county is the property in?
                </h3>

                <div className="relative">
                  <input
                    type="text"
                    name="propertyCounty"
                    value={formData.propertyCounty}
                    onChange={(e) => handleCountyChange(e.target.value)}
                    onFocus={() => formData.propertyCounty && handleCountyChange(formData.propertyCounty)}
                    onBlur={() => setTimeout(() => setShowCountySuggestions(false), 200)}
                    placeholder="Start typing..."
                    className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                    autoFocus
                    autoComplete="off"
                  />
                  {showCountySuggestions && countySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#D2C6B2] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {countySuggestions.map((county) => (
                        <button
                          key={county}
                          type="button"
                          onClick={() => selectCounty(county)}
                          className="w-full px-6 py-3 text-left text-lg text-[#3A4045] hover:bg-[#F5EFD9] transition-colors border-b border-[#D2C6B2] last:border-b-0"
                        >
                          {county}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.propertyCounty} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 10: Street Address */}
            {currentStep === 10 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is the street address or APN?
                </h3>
                <p className="text-sm text-[#7D6B58] -mt-4 mb-4">(Check your tax bill for APN)</p>

                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Ex: Riverway Rd or R102777"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.streetAddress} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 11: Full Name */}
            {currentStep === 11 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your full name?
                </h3>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="First and Last Name"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.fullName} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 12: Names on Deed */}
            {currentStep === 12 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What names are on the deed?
                </h3>

                <input
                  type="text"
                  name="namesOnDeed"
                  value={formData.namesOnDeed}
                  onChange={handleChange}
                  placeholder="All names on the property deed"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.namesOnDeed} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 13: Email */}
            {currentStep === 13 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your email address?
                </h3>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={(e) => {
                    const result = validateEmail(e.target.value);
                    if (!result.valid) setEmailError(result.error);
                  }}
                  placeholder="your@email.com"
                  className={`w-full px-6 py-4 text-lg border-2 rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors ${emailError ? 'border-red-400 bg-red-50' : 'border-[#D2C6B2]'}`}
                  autoFocus
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-2">{emailError}</p>
                )}

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleNext} disabled={!formData.email || !validateEmail(formData.email).valid} className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 14: Phone */}
            {currentStep === 14 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  What is your phone number?
                </h3>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(469) 640-3864"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors"
                  autoFocus
                />

                <div className="bg-[#F5EFD9] p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="smsConsent"
                      checked={formData.smsConsent}
                      onChange={(e) => setFormData({...formData, smsConsent: e.target.checked})}
                      className="mt-1 w-5 h-5 text-[#2F4F33] border-[#D2C6B2] rounded focus:ring-[#2F4F33]"
                    />
                    <span className="text-sm text-[#3A4045]">
                      By continuing, you agree to receive SMS messages from Haven Ground about your property inquiry. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. <a href="https://havenground.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2F4F33]">Privacy Policy</a> | <a href="https://havenground.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2F4F33]">Terms of Service</a>
                    </span>
                  </label>
                </div>

                {otpError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {otpError}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={handleBack} className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={!formData.phone || !formData.smsConsent || isLoading}
                    className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 15: OTP Verification */}
            {currentStep === 15 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif text-[#2F4F33] mb-6 leading-tight">
                  Enter verification code
                </h3>

                <p className="text-[#3A4045] mb-4">
                  We sent a code to <strong>{formData.phone}</strong>
                </p>

                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter code"
                  maxLength="8"
                  className="w-full px-6 py-4 text-lg border-2 border-[#D2C6B2] rounded-lg focus:border-[#2F4F33] focus:outline-none bg-transparent text-[#3A4045] transition-colors text-center tracking-widest font-bold"
                  autoFocus
                />

                {otpError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {otpError}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(14);
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpError('');
                    }}
                    className="flex-1 bg-white border-2 border-[#2F4F33] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#F5EFD9] transition-all duration-300"
                  >
                    ← Change Number
                  </button>
                  <button
                    type="button"
                    onClick={verifyOTP}
                    disabled={otpCode.length < 4 || isLoading}
                    className="flex-1 bg-[#2F4F33] text-[#F5EFD9] px-8 py-4 text-lg font-medium hover:bg-[#1a2e1c] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Submit →'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={isLoading}
                  className="w-full text-[#2F4F33] underline hover:text-[#7D6B58] transition-colors"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            )}
          </form>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `}</style>
        </div>
      </div>

      {/* Final Trust Section */}
      <div className="py-16 bg-[#2F4F33]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl text-[#F5EFD9] font-serif font-light mb-6">No Pressure, Just Honest Conversation</h2>
          <p className="text-xl text-[#D2C6B2] mb-8 leading-relaxed">
            We know selling land is a big decision. Take your time, ask questions, and make the choice that's right for you. We'll be here either way.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-[#F5EFD9] py-16 border-t border-[#7D6B58]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-[#F5EFD9] italic font-serif">Haven Ground</h3>
              </div>
              <p className="text-[#D2C6B2] text-lg mb-4 leading-relaxed">Land and community, one meaningful handshake at a time.</p>
              <img src="/images/isaiah-58-10-banner.png" alt="Isaiah 58:10 - If you pour yourself out for the hungry" className="h-20 md:h-24 lg:h-28 w-auto" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Home</a></li>
                <li><a href="/properties" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Properties</a></li>
                <li><a href="/development" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Development</a></li>
                <li><a href="/sell-your-land" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Sell Us Land</a></li>
                <li><a href="/community" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <p className="text-[#D2C6B2] text-sm">Find your homesite that feels the most like home</p>
                <a href="/sell-your-land#contact-form" className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#7D6B58] text-center">
            <p className="text-[#D2C6B2] text-sm">
              &copy; {new Date().getFullYear()} Haven Ground. All rights reserved.
              <span className="mx-2">|</span>
              Serving land owners from our heart.
              <span className="mx-2">|</span>
              <a href="/privacy-policy" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Privacy Policy</a>
              <span className="mx-2">|</span>
              <a href="/terms-of-use" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200 underline">Terms of Use</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
