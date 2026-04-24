function humanize(value) {
  return (value || '')
    .toString()
    .replace(/\[(\d+)\]/g, ' $1 ')
    .split('.')
    .join(' ')
    .split('_')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'verified', 'success'].includes(normalized);
  }
  return null;
}

function findVerificationFlag(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const nested = findVerificationFlag(item);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  }

  for (const key of ['verified', 'is_verified', 'success']) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const value = toBoolean(node[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  for (const value of Object.values(node)) {
    const nested = findVerificationFlag(value);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}

/**
 * Analyzes structured AI response to derive specific failure reasons
 * Handles response format: { decision, extracted_info, inputs, confidence }
 */
function analyzeStructuredResponse(rawResponse, verificationType) {
  if (!rawResponse) {
    console.log('[verificationDisplay] No rawResponse provided');
    return [];
  }

  // CRITICAL FIX: Parse rawResponse if it's a string
  let parsedResponse = rawResponse;
  if (typeof rawResponse === 'string') {
    try {
      console.log('[verificationDisplay] rawResponse is a string, parsing...');
      parsedResponse = JSON.parse(rawResponse);
    } catch (error) {
      console.error('[verificationDisplay] Failed to parse rawResponse:', error);
      return [];
    }
  }

  if (typeof parsedResponse !== 'object') {
    console.log('[verificationDisplay] Invalid rawResponse type:', typeof parsedResponse);
    return [];
  }

  console.log('[verificationDisplay] Analyzing structured response:', {
    verificationType,
    parsedResponse
  });

  const reasons = [];
  
  // Extract key sections from response
  const decision = parsedResponse.decision || {};
  const extractedInfo = parsedResponse.extracted_info || {};
  const inputs = parsedResponse.inputs || {};
  const confidence = parsedResponse.confidence || {};
  const thresholdAndConfidence = parsedResponse.threshold_and_confidence || {};

  console.log('[verificationDisplay] Extracted sections:', {
    decision,
    extractedInfo,
    inputs,
    confidence,
    thresholdAndConfidence
  });

  // Check if verification failed
  const verified = toBoolean(decision.verified) ?? false;
  if (verified) {
    console.log('[verificationDisplay] Verification passed, no failure reasons needed');
    return []; // No failure reasons if verified
  }

  // OWNER VERIFICATION ANALYSIS
  if (verificationType === 'OWNER' || verificationType === 'OWNER_IDENTITY') {
    console.log('[verificationDisplay] Analyzing OWNER verification');
    
    // CASE 1: PAN number not detected from OCR
    if (inputs.actual_pan_number && (extractedInfo.pan_number_from_ocr === null || extractedInfo.pan_number_from_ocr === undefined || extractedInfo.pan_number_from_ocr === '')) {
      console.log('[verificationDisplay] PAN not detected');
      reasons.push('PAN number not detected from ID card');
    }
    // CASE 2: PAN number mismatch
    else if (extractedInfo.pan_number_from_ocr && inputs.actual_pan_number && 
             extractedInfo.pan_number_from_ocr.trim().toUpperCase() !== inputs.actual_pan_number.trim().toUpperCase()) {
      console.log('[verificationDisplay] PAN mismatch:', extractedInfo.pan_number_from_ocr, 'vs', inputs.actual_pan_number);
      reasons.push('PAN number does not match');
    }

    // CASE 3: Owner name not detected
    if (inputs.actual_owner_name && (extractedInfo.owner_name_from_ocr === null || extractedInfo.owner_name_from_ocr === undefined || extractedInfo.owner_name_from_ocr === '')) {
      console.log('[verificationDisplay] Owner name not detected');
      reasons.push('Owner name not detected from PAN card');
    }
    // CASE 4: Owner name mismatch
    else if (extractedInfo.owner_name_from_ocr && inputs.actual_owner_name) {
      const extractedName = extractedInfo.owner_name_from_ocr.trim().toLowerCase().replace(/\s+/g, ' ');
      const actualName = inputs.actual_owner_name.trim().toLowerCase().replace(/\s+/g, ' ');
      if (extractedName !== actualName) {
        console.log('[verificationDisplay] Owner name mismatch:', extractedName, 'vs', actualName);
        reasons.push('Owner name does not match PAN card');
      }
    }

    // CASE 5: Face not matched
    if (extractedInfo.face_match === false || extractedInfo.face_matched === false) {
      console.log('[verificationDisplay] Face not matched');
      reasons.push('Face not matched');
    }

    // CASE 6: Signature not matched
    if (extractedInfo.signature_match === false || extractedInfo.signature_matched === false) {
      console.log('[verificationDisplay] Signature not matched');
      reasons.push('Signature not matched');
    }

    // CASE 7: Government emblem not detected
    if (extractedInfo.govt_emblem === false || extractedInfo.emblem_detected === false) {
      console.log('[verificationDisplay] Govt emblem not detected');
      reasons.push('Govt emblem not detected');
    }

    // CASE 8: Government of India header not found
    if (extractedInfo.government_of_india === false || extractedInfo.goi_header === false) {
      console.log('[verificationDisplay] GOI header not found');
      reasons.push('Government of India header not found');
    }

    // CASE 9: Income Tax Department header not found
    if (extractedInfo.income_tax_department === false || extractedInfo.it_department === false) {
      console.log('[verificationDisplay] IT Department header not found');
      reasons.push('Income Tax Department header not found');
    }
  }

  // STUDENT VERIFICATION ANALYSIS
  if (verificationType === 'STUDENT' || verificationType === 'STUDENT_IDENTITY') {
    console.log('[verificationDisplay] Analyzing STUDENT verification');
    
    // CASE 1: PRN not detected from OCR
    if (inputs.actual_prn && (extractedInfo.prn_from_ocr === null || extractedInfo.prn_from_ocr === undefined || extractedInfo.prn_from_ocr === '')) {
      console.log('[verificationDisplay] PRN not detected');
      reasons.push('PRN not detected from ID card');
    }
    // CASE 2: PRN mismatch
    else if (extractedInfo.prn_from_ocr && inputs.actual_prn && 
             extractedInfo.prn_from_ocr.trim().toUpperCase() !== inputs.actual_prn.trim().toUpperCase()) {
      console.log('[verificationDisplay] PRN mismatch:', extractedInfo.prn_from_ocr, 'vs', inputs.actual_prn);
      reasons.push('PRN does not match');
    }

    // CASE 3: College name not detected
    if (inputs.actual_college_name && (extractedInfo.college_name_from_ocr === null || extractedInfo.college_name_from_ocr === undefined || extractedInfo.college_name_from_ocr === '')) {
      console.log('[verificationDisplay] College name not detected');
      reasons.push('College name not detected from ID card');
    }
    // CASE 4: College name mismatch
    else if (extractedInfo.college_name_from_ocr && inputs.actual_college_name) {
      const extractedCollege = extractedInfo.college_name_from_ocr.trim().toLowerCase().replace(/\s+/g, ' ');
      const actualCollege = inputs.actual_college_name.trim().toLowerCase().replace(/\s+/g, ' ');
      if (extractedCollege !== actualCollege) {
        console.log('[verificationDisplay] College name mismatch:', extractedCollege, 'vs', actualCollege);
        reasons.push('College name does not match');
      }
    }

    // CASE 5: Face not matched
    if (extractedInfo.face_match === false || extractedInfo.face_matched === false) {
      console.log('[verificationDisplay] Face not matched');
      reasons.push('Face not matched');
    }

    // CASE 6: Barcode not detected
    if (extractedInfo.barcode_detected === false || extractedInfo.qr_code_detected === false) {
      console.log('[verificationDisplay] Barcode not detected');
      reasons.push('Barcode not detected');
    }
  }

  // CASE: Low confidence / poor image quality
  if (confidence.overall !== undefined && confidence.overall < 0.5) {
    console.log('[verificationDisplay] Overall confidence too low:', confidence.overall);
    reasons.push('Image quality is too low');
  } else if (confidence.ocr !== undefined && confidence.ocr < 0.5) {
    console.log('[verificationDisplay] OCR confidence too low:', confidence.ocr);
    reasons.push('Image quality is too low for text recognition');
  } else if (confidence.face !== undefined && confidence.face < 0.5) {
    console.log('[verificationDisplay] Face confidence too low:', confidence.face);
    reasons.push('Face image quality is too low');
  }

  // Check threshold_and_confidence for additional quality issues
  if (thresholdAndConfidence.live_image_confidence !== undefined && 
      thresholdAndConfidence.live_image_threshold !== undefined &&
      thresholdAndConfidence.live_image_confidence < thresholdAndConfidence.live_image_threshold) {
    console.log('[verificationDisplay] Live image confidence below threshold');
    reasons.push('Live image quality is too low');
  }

  console.log('[verificationDisplay] Final reasons from structured analysis:', reasons);
  return reasons;
}

// Student verification field mappings (fallback for old format)
const STUDENT_FIELD_MAPPINGS = {
  'prn': 'PRN not matched',
  'prn_match': 'PRN not matched',
  'prn_matched': 'PRN not matched',
  'enrollment_number': 'PRN not matched',
  'enrollment': 'PRN not matched',
  'face': 'Face not matched',
  'face_match': 'Face not matched',
  'face_matched': 'Face not matched',
  'face_recognition': 'Face not matched',
  'college': 'College name not matched',
  'college_name': 'College name not matched',
  'college_match': 'College name not matched',
  'college_matched': 'College name not matched',
  'barcode': 'Barcode not matched',
  'barcode_match': 'Barcode not matched',
  'barcode_matched': 'Barcode not matched',
  'qr_code': 'Barcode not matched',
  'qr': 'Barcode not matched',
};

// Owner verification field mappings (fallback for old format)
const OWNER_FIELD_MAPPINGS = {
  'face': 'Face not matched',
  'face_match': 'Face not matched',
  'face_matched': 'Face not matched',
  'face_recognition': 'Face not matched',
  'owner_name': 'Owner name not matched',
  'name': 'Owner name not matched',
  'name_match': 'Owner name not matched',
  'name_matched': 'Owner name not matched',
  'pan': 'PAN number not matched',
  'pan_number': 'PAN number not matched',
  'pan_match': 'PAN number not matched',
  'pan_matched': 'PAN number not matched',
  'emblem': 'Govt emblem not detected',
  'govt_emblem': 'Govt emblem not detected',
  'government_emblem': 'Govt emblem not detected',
  'emblem_detected': 'Govt emblem not detected',
  'government_of_india': 'Government of India header not found',
  'govt_of_india': 'Government of India header not found',
  'goi_header': 'Government of India header not found',
  'income_tax': 'Income Tax Department header not found',
  'income_tax_department': 'Income Tax Department header not found',
  'it_department': 'Income Tax Department header not found',
  'signature': 'Signature not matched',
  'signature_match': 'Signature not matched',
  'signature_matched': 'Signature not matched',
};

function extractFailedFieldKeys(node, keys = []) {
  if (!node || typeof node !== 'object') {
    return keys;
  }

  if (Array.isArray(node)) {
    node.forEach(item => extractFailedFieldKeys(item, keys));
    return keys;
  }

  Object.entries(node).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // If value is false or 0, this field failed
    if (value === false || value === 0 || value === '0' || value === 'false') {
      keys.push(normalizedKey);
    }
    // If value is an object, recurse
    else if (value && typeof value === 'object') {
      extractFailedFieldKeys(value, keys);
    }
  });

  return keys;
}

function mapFailedFieldsToReasons(failedKeys, verificationType) {
  const mappings = verificationType === 'STUDENT' ? STUDENT_FIELD_MAPPINGS : OWNER_FIELD_MAPPINGS;
  const reasons = new Set();

  failedKeys.forEach(key => {
    // Direct match
    if (mappings[key]) {
      reasons.add(mappings[key]);
      return;
    }

    // Partial match - check if key contains any mapping key
    for (const [mappingKey, reason] of Object.entries(mappings)) {
      if (key.includes(mappingKey) || mappingKey.includes(key)) {
        reasons.add(reason);
        return;
      }
    }
  });

  return Array.from(reasons);
}

function collectFailureReasonsFromRejectedParams(rejectedParameters, verificationType) {
  if (!rejectedParameters || typeof rejectedParameters !== 'object') {
    return [];
  }

  // Extract all failed field keys from the rejected parameters
  const failedKeys = extractFailedFieldKeys(rejectedParameters);
  
  // Map failed keys to user-friendly reasons
  const mappedReasons = mapFailedFieldsToReasons(failedKeys, verificationType);
  
  return mappedReasons;
}

function dedupe(values) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

export function prepareVerificationDisplay(result) {
  if (!result) {
    console.log('[verificationDisplay] No result provided');
    return null;
  }

  console.log('[verificationDisplay] Processing result:', {
    verified: result.verified,
    verificationType: result.verificationType,
    hasRawResponse: !!result.rawResponse,
    hasRejectedParameters: !!result.rejectedParameters,
    message: result.message
  });

  const nestedVerified = findVerificationFlag(result.rawResponse);
  const verified = toBoolean(result.verified) ?? nestedVerified ?? false;
  
  // Determine verification type from result
  const verificationType = result.verificationType || 'STUDENT';
  
  let failedReasons = [];

  if (!verified) {
    console.log('[verificationDisplay] Verification failed, analyzing reasons...');
    
    // PRIORITY 1: Analyze structured response (new format with decision, extracted_info, inputs)
    const structuredReasons = analyzeStructuredResponse(result.rawResponse, verificationType);
    console.log('[verificationDisplay] Structured reasons:', structuredReasons);
    
    if (structuredReasons.length > 0) {
      failedReasons = structuredReasons;
    } else {
      console.log('[verificationDisplay] No structured reasons, trying rejectedParameters...');
      // PRIORITY 2: Fallback to rejectedParameters (old format)
      failedReasons = collectFailureReasonsFromRejectedParams(result.rejectedParameters, verificationType);
      console.log('[verificationDisplay] RejectedParameters reasons:', failedReasons);
    }
    
    // PRIORITY 3: Fallback to message if no specific reasons found
    if (failedReasons.length === 0 && result.message) {
      console.log('[verificationDisplay] Using message as fallback:', result.message);
      failedReasons = [result.message];
    }
    
    // PRIORITY 4: Generic fallback
    if (failedReasons.length === 0) {
      console.log('[verificationDisplay] Using generic fallback');
      failedReasons = ['Verification failed. Please check your details.'];
    }
  }

  console.log('[verificationDisplay] Final result:', {
    verified,
    status: verified ? 'SUCCESS' : (result.status || 'FAILED'),
    failedReasons
  });

  return {
    ...result,
    verified,
    status: verified ? 'SUCCESS' : (result.status || 'FAILED'),
    failedReasons: dedupe(failedReasons),
  };
}
