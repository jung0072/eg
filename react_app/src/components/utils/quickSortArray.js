export function sortByOrder(data) {
	function quickSort(data, start, end) {
		if (start >= end) {
			return;
		}

		let pivotIndex = partition(data, start, end);
		quickSort(data, start, pivotIndex - 1);
		quickSort(data, pivotIndex + 1, end);
	}

	function partition(data, start, end) {
		let pivot = data[end].order;
		let i = start - 1;

		for (let j = start; j <= end - 1; j++) {
			if (data[j].order < pivot) {
				i++;
				[data[i], data[j]] = [data[j], data[i]];
			}
		}

		[data[i + 1], data[end]] = [data[end], data[i + 1]];
		return i + 1;
	}

	let dataCopy = [...data];
	quickSort(dataCopy, 0, dataCopy.length - 1);

	return dataCopy;
}
