import os


def create_log_files(base_directory):
    # Create the log files if they do not exist, first check if we have a log folder then check if we have each file:wq
    log_directory_path = os.path.join(base_directory, 'logs')
    log_file_paths = [
        os.path.join(base_directory, 'logs', 'engage-ic4u.log'), os.path.join(base_directory, 'logs', 'errors.log')
    ]
    if not os.path.exists(log_directory_path):
        os.makedirs(log_directory_path)

    for file_path in log_file_paths:
        if not os.path.exists(file_path):
            open(file_path, 'a').close()

    return dict(
        log=log_file_paths[0],
        error=log_file_paths[1]
    )
