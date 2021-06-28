const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);

    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
};

export default formatDate;
