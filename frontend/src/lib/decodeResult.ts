function decodeResult(result: number[]) {
  // Convert the array of ASCII values to a string
  const jsonString = String.fromCharCode(...result);

  // Parse the JSON string into a JavaScript object
  try {
    const decodedData: any = JSON.parse(jsonString);
    return decodedData;
  } catch (error) {
    throw new Error("Failed to decode result: Invalid JSON structure.");
  }
}
