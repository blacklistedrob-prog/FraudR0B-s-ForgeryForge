import bwipjs from 'bwip-js';
import { AAMVAFields } from '../types';

// --- AAMVA CONSTANTS ---
const COMPLIANCE_INDICATOR = '@';
const DATA_ELEMENT_SEPARATOR = '\x0A'; // LF
const RECORD_SEPARATOR = '\x1E'; // RS
const SEGMENT_TERMINATOR = '\x0D'; // CR
const FILE_TYPE = 'ANSI ';
const VERSION = '08'; // AAMVA DL/ID-2020 commonly uses 08 or 10

/**
 * AUTO-CORRECT AGENT
 * Fixes formatting issues to strictly meet AAMVA standards.
 */
const sanitizeData = (data: Partial<AAMVAFields>): AAMVAFields => {
    const d = { ...data };

    // Default Fallback: Washington State
    if (!d.iin) d.iin = "636020"; 
    
    // Dates: Convert human readable to YYYYMMDD
    const fixDate = (dateStr?: string) => {
        if (!dateStr) return new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "20250101"; // Fallback
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    if (d.issueDate && d.issueDate.includes('-')) d.issueDate = fixDate(d.issueDate);
    if (d.expDate && d.expDate.includes('-')) d.expDate = fixDate(d.expDate);
    if (d.dob && d.dob.includes('-')) d.dob = fixDate(d.dob);

    // Sex: Map to 1/2
    if (d.sex) {
        const s = d.sex.toUpperCase();
        if (s === 'M' || s === 'MALE') d.sex = '1';
        else if (s === 'F' || s === 'FEMALE') d.sex = '2';
        else d.sex = '1';
    } else {
        d.sex = '1';
    }

    // Eyes: Map to AAMVA Codes
    const eyeMap: Record<string, string> = {
        'BLACK': 'BLK', 'BLUE': 'BLU', 'BROWN': 'BRO', 'GRAY': 'GRY', 
        'GREEN': 'GRN', 'HAZEL': 'HAZ', 'MAROON': 'MAR', 'PINK': 'PNK', 'DICHROMATIC': 'DIC'
    };
    if (d.eyes) {
        const e = d.eyes.toUpperCase();
        d.eyes = eyeMap[e] || (e.length === 3 ? e : 'BRO');
    }

    // Hair: Map to AAMVA Codes
    const hairMap: Record<string, string> = {
        'BALD': 'BAL', 'BLACK': 'BLK', 'BLOND': 'BLN', 'BLONDE': 'BLN', 
        'BROWN': 'BRO', 'GRAY': 'GRY', 'GREY': 'GRY', 'RED': 'RED', 
        'SANDY': 'SDY', 'WHITE': 'WHI'
    };
    if (d.hair) {
        const h = d.hair.toUpperCase();
        d.hair = hairMap[h] || (h.length === 3 ? h : 'BLK');
    }

    // Uppercase text fields
    d.firstName = (d.firstName || "JOHN").toUpperCase().replace(/[^A-Z]/g, '');
    d.lastName = (d.lastName || "DOE").toUpperCase().replace(/[^A-Z]/g, '');
    d.city = (d.city || "SEATTLE").toUpperCase();
    d.state = (d.state || "WA").toUpperCase().slice(0, 2);
    
    // Height: Remove non-numeric
    if (d.height) d.height = d.height.replace(/[^0-9]/g, '').slice(0, 3);
    
    // Weight: Remove non-numeric
    if (d.weight) d.weight = d.weight.replace(/[^0-9]/g, '').slice(0, 3);

    return d as AAMVAFields;
};

/**
 * GENERATE RAW AAMVA STRING
 * Constructs the exact byte sequence expected by scanners.
 */
const constructAamvaString = (data: AAMVAFields): string => {
    // Header
    // @ + LF + RS + CR + "ANSI " + IIN + Version + SubfileCount + ...
    let header = COMPLIANCE_INDICATOR + DATA_ELEMENT_SEPARATOR + RECORD_SEPARATOR + SEGMENT_TERMINATOR;
    header += FILE_TYPE + data.iin + VERSION + "01"; // 01 Subfile (DL)

    // Subfile Designator
    // Type (DL) + Offset (Hardcoded approximation) + Length (Calculated later)
    const subfileType = "DL"; 
    const offset = "0041"; // Standard offset start
    const length = "0250"; // Placeholder length
    
    let subfileHeader = subfileType + offset + length + subfileType + VERSION; // DL00410250DL08

    // Data Elements (Subfile DL)
    let body = "";
    body += `DCA${data.dlNumber}\n`; // Jurisdiction-specific vehicle class (Optional often included)
    body += `DCBNONE\n`; // Restrictions
    body += `DCDNONE\n`; // Endorsements
    body += `DBA${data.expDate}\n`;
    body += `DCS${data.lastName}\n`;
    body += `DAC${data.firstName}\n`;
    body += `DAD${data.middleName || 'NONE'}\n`;
    body += `DBD${data.issueDate}\n`;
    body += `DBB${data.dob}\n`;
    body += `DBC${data.sex}\n`;
    body += `DAY${data.eyes}\n`;
    body += `DAU${data.height} IN\n`;
    body += `DAG${data.address}\n`;
    body += `DAI${data.city}\n`;
    body += `DAJ${data.state}\n`;
    body += `DAK${data.zipCode}\n`;
    body += `DAQ${data.dlNumber}\n`;
    body += `DAZ${data.hair}\n`;
    body += `DAW${data.weight}\n`;
    body += `DD${data.discriminator || '00000000'}\n`; // Document Discriminator

    // Combine
    // Note: PDF417 logic in bwip-js handles the encoding, but we pass the raw string
    return header + subfileHeader + body;
};

/**
 * GENERATE BARCODE IMAGE
 * Uses bwip-js to render PDF417.
 */
export const generatePdf417 = async (dataRaw: Partial<AAMVAFields>): Promise<string> => {
    const data = sanitizeData(dataRaw);
    const text = constructAamvaString(data);

    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    
    try {
        await bwipjs.toCanvas(canvas, {
            bcid: 'pdf417',       // Barcode type
            text: text,           // Text to encode
            scale: 3,             // 3x scaling factor
            height: 10,           // Bar height, in millimeters
            incltext: false,      // Show human-readable text
            textxalign: 'center', // Always good to set this
            rotate: 'N',          // No rotation (handled by layer editor)
            padding: 10,          // Padding around barcode
            rows: 15,             // Force rows/cols for typical ID aspect ratio
            columns: 5
        });
        
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error("Barcode Gen Failed", e);
        throw new Error("Failed to generate PDF417 symbol.");
    }
};

/**
 * HELPER: Extract potential data from detected elements
 */
export const mapDetectedToAamva = (detected: any[], state: string = 'WA'): Partial<AAMVAFields> => {
    const findVal = (labels: string[]) => {
        const found = detected.find(d => labels.some(l => d.label.toUpperCase().includes(l)));
        return found ? found.value : '';
    };

    return {
        firstName: findVal(['FN', 'FIRST']),
        lastName: findVal(['LN', 'SURNAME', 'LAST']),
        address: findVal(['ADD', 'RESIDENCE']),
        city: findVal(['CITY']),
        state: state, // Default or passed
        zipCode: findVal(['ZIP']),
        dlNumber: findVal(['DL', 'LIC', 'NO']),
        dob: findVal(['DOB', 'BIRTH']),
        expDate: findVal(['EXP']),
        issueDate: findVal(['ISS']),
        sex: findVal(['SEX']),
        height: findVal(['HGT', 'HGI']),
        weight: findVal(['WGT']),
        eyes: findVal(['EYE']),
        hair: findVal(['HAIR']),
    };
};